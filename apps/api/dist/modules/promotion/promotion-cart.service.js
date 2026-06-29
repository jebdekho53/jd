"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionCartService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let PromotionCartService = class PromotionCartService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async validateCoupon(buyerProfileId, code, cart) {
        try {
            const coupon = await this.resolveCoupon(code, buyerProfileId, cart);
            return { valid: true, coupon };
        }
        catch (err) {
            return {
                valid: false,
                message: err instanceof Error ? err.message : 'Invalid coupon',
            };
        }
    }
    async applyCoupon(userId, code) {
        const buyerProfileId = await this.requireBuyerProfileId(userId);
        const cart = await this.prisma.cart.findFirst({
            where: { buyerProfileId },
            include: {
                items: {
                    include: {
                        variant: { select: { price: true } },
                    },
                },
            },
        });
        if (!cart || cart.items.length === 0)
            throw new common_1.BadRequestException('Cart is empty');
        const subtotal = cart.items.reduce((s, i) => s + Number(i.variant.price) * i.quantity, 0);
        const stubCart = {
            id: cart.id,
            storeId: cart.storeId,
            store: { id: cart.storeId, name: '', slug: '', minOrderAmount: 0 },
            items: [],
            totals: {
                subtotal,
                discount: 0,
                catalogSavings: 0,
                offerDiscount: 0,
                couponDiscount: 0,
                deliveryDiscount: 0,
                totalSavings: 0,
                tax: 0,
                deliveryFee: 0,
                grandTotal: subtotal,
            },
            itemCount: cart.items.length,
        };
        const coupon = await this.resolveCoupon(code, buyerProfileId, stubCart);
        await this.prisma.cart.update({
            where: { id: cart.id },
            data: { appliedCouponId: coupon.id },
        });
    }
    async removeCoupon(userId) {
        const buyerProfileId = await this.requireBuyerProfileId(userId);
        const cart = await this.prisma.cart.findFirst({ where: { buyerProfileId } });
        if (!cart)
            return;
        await this.prisma.cart.update({
            where: { id: cart.id },
            data: { appliedCouponId: null },
        });
    }
    async resolveCoupon(code, buyerProfileId, cart) {
        const normalized = code.trim().toUpperCase();
        const coupon = await this.prisma.coupon.findFirst({
            where: { code: { equals: normalized, mode: 'insensitive' } },
        });
        if (!coupon)
            throw new common_1.BadRequestException('Coupon not found');
        if (!coupon.isActive || coupon.suspendedAt) {
            throw new common_1.BadRequestException('This coupon is no longer active');
        }
        const now = new Date();
        if (now < coupon.startsAt)
            throw new common_1.BadRequestException('Coupon is not active yet');
        if (now > coupon.expiresAt)
            throw new common_1.BadRequestException('Coupon has expired');
        if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
            throw new common_1.BadRequestException('Coupon usage limit reached');
        }
        if (Number(coupon.minOrderAmount) > cart.totals.subtotal) {
            throw new common_1.BadRequestException(`Minimum order value ₹${Number(coupon.minOrderAmount)} required`);
        }
        if (coupon.storeId && coupon.storeId !== cart.storeId) {
            throw new common_1.BadRequestException('Coupon is not valid for this store');
        }
        const userUsage = await this.prisma.couponUsage.count({
            where: { couponId: coupon.id, buyerProfileId },
        });
        if (userUsage >= coupon.perUserLimit) {
            throw new common_1.BadRequestException('You have already used this coupon');
        }
        if (coupon.firstOrderOnly) {
            const priorOrders = await this.prisma.order.count({
                where: {
                    buyerProfileId,
                    status: { in: ['DELIVERED', 'COMPLETED'] },
                },
            });
            if (priorOrders > 0) {
                throw new common_1.BadRequestException('This coupon is for first orders only');
            }
        }
        return coupon;
    }
    async requireBuyerProfileId(userId) {
        const bp = await this.prisma.buyerProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!bp)
            throw new common_1.NotFoundException('Buyer profile not found');
        return bp.id;
    }
};
exports.PromotionCartService = PromotionCartService;
exports.PromotionCartService = PromotionCartService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PromotionCartService);
//# sourceMappingURL=promotion-cart.service.js.map