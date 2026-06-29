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
exports.ProcurementCartService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const merchant_dashboard_service_1 = require("../merchant-dashboard/merchant-dashboard.service");
let ProcurementCartService = class ProcurementCartService {
    constructor(prisma, merchantDashboard) {
        this.prisma = prisma;
        this.merchantDashboard = merchantDashboard;
    }
    async getCart(userId, storeId) {
        const profile = await this.resolveMerchant(userId);
        let cart = await this.prisma.procurementCart.findFirst({
            where: { merchantProfileId: profile.id, ...(storeId ? { storeId } : {}) },
            include: {
                items: { include: { vendorProduct: { include: { vendor: true, inventory: true } } } },
            },
            orderBy: { updatedAt: 'desc' },
        });
        if (!cart) {
            cart = await this.prisma.procurementCart.create({
                data: { merchantProfileId: profile.id, storeId },
                include: {
                    items: { include: { vendorProduct: { include: { vendor: true, inventory: true } } } },
                },
            });
        }
        return cart;
    }
    async updateCart(userId, dto) {
        const profile = await this.resolveMerchant(userId);
        if (dto.storeId) {
            const ctx = await this.merchantDashboard.resolveStoreContext(userId, dto.storeId);
            if (!ctx.storeIds.includes(dto.storeId))
                throw new common_1.ForbiddenException('Invalid store');
        }
        let cart = await this.prisma.procurementCart.findFirst({
            where: { merchantProfileId: profile.id, storeId: dto.storeId ?? undefined },
        });
        if (!cart) {
            cart = await this.prisma.procurementCart.create({
                data: { merchantProfileId: profile.id, storeId: dto.storeId, vendorId: dto.vendorId },
            });
        }
        await this.prisma.procurementCartItem.deleteMany({ where: { cartId: cart.id } });
        for (const item of dto.items) {
            const product = await this.prisma.vendorProduct.findUnique({
                where: { id: item.vendorProductId },
                include: { priceTiers: { orderBy: { minQty: 'desc' } } },
            });
            if (!product || !product.isActive)
                throw new common_1.BadRequestException('Product unavailable');
            if (item.quantity < product.moq) {
                throw new common_1.BadRequestException(`MOQ is ${product.moq} for ${product.name}`);
            }
            const tier = product.priceTiers.find((t) => item.quantity >= t.minQty);
            const unitPrice = tier ? Number(tier.unitPrice) : Number(product.basePrice);
            await this.prisma.procurementCartItem.create({
                data: { cartId: cart.id, vendorProductId: item.vendorProductId, quantity: item.quantity, unitPrice },
            });
        }
        return this.getCart(userId, dto.storeId);
    }
    async addItem(userId, dto, storeId) {
        const cart = await this.getCart(userId, storeId);
        const existing = cart.items.find((i) => i.vendorProductId === dto.vendorProductId);
        const items = existing
            ? cart.items.map((i) => i.vendorProductId === dto.vendorProductId
                ? { vendorProductId: i.vendorProductId, quantity: i.quantity + dto.quantity }
                : { vendorProductId: i.vendorProductId, quantity: i.quantity })
            : [
                ...cart.items.map((i) => ({ vendorProductId: i.vendorProductId, quantity: i.quantity })),
                { vendorProductId: dto.vendorProductId, quantity: dto.quantity },
            ];
        return this.updateCart(userId, { items, storeId });
    }
    async resolveMerchant(userId) {
        const profile = await this.prisma.merchantProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.ForbiddenException('Merchant profile required');
        return profile;
    }
};
exports.ProcurementCartService = ProcurementCartService;
exports.ProcurementCartService = ProcurementCartService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        merchant_dashboard_service_1.MerchantDashboardService])
], ProcurementCartService);
//# sourceMappingURL=procurement-cart.service.js.map