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
exports.ProcurementOrderService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../database/prisma.service");
const procurement_cart_service_1 = require("./procurement-cart.service");
function generateVendorOrderNumber() {
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    return `VP-${ymd}-${(0, crypto_1.randomBytes)(3).toString('hex').toUpperCase()}`;
}
let ProcurementOrderService = class ProcurementOrderService {
    constructor(prisma, cartService) {
        this.prisma = prisma;
        this.cartService = cartService;
    }
    async createOrder(userId, dto) {
        const profile = await this.prisma.merchantProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.ForbiddenException('Merchant profile required');
        const cart = await this.cartService.getCart(userId, dto.storeId);
        if (cart.items.length === 0)
            throw new common_1.BadRequestException('Procurement cart is empty');
        const vendorIds = new Set(cart.items.map((i) => i.vendorProduct.vendorId));
        if (vendorIds.size > 1)
            throw new common_1.BadRequestException('Cart must contain items from one vendor');
        const vendorId = cart.items[0].vendorProduct.vendorId;
        let subtotal = 0;
        let taxAmount = 0;
        for (const item of cart.items) {
            const line = Number(item.unitPrice) * item.quantity;
            subtotal += line;
            taxAmount += line * (item.vendorProduct.gstRate / 100);
        }
        const totalAmount = subtotal + taxAmount;
        let creditUsed = 0;
        if (dto.useCredit) {
            const credit = await this.prisma.vendorCreditLine.findUnique({
                where: { vendorId_merchantProfileId: { vendorId, merchantProfileId: profile.id } },
            });
            if (credit && credit.isActive) {
                const available = Number(credit.creditLimit) - Number(credit.usedLimit);
                creditUsed = Math.min(available, totalAmount);
            }
        }
        const order = await this.prisma.$transaction(async (tx) => {
            let orderNumber;
            let attempts = 0;
            do {
                orderNumber = generateVendorOrderNumber();
                attempts++;
            } while ((await tx.vendorOrder.findUnique({ where: { orderNumber } })) && attempts < 5);
            const created = await tx.vendorOrder.create({
                data: {
                    orderNumber,
                    merchantProfileId: profile.id,
                    storeId: dto.storeId,
                    vendorId,
                    status: client_1.VendorOrderStatus.PENDING,
                    subtotal,
                    taxAmount,
                    totalAmount,
                    creditUsed,
                    notes: dto.notes,
                    items: {
                        create: cart.items.map((i) => ({
                            vendorProductId: i.vendorProductId,
                            sku: i.vendorProduct.sku,
                            productName: i.vendorProduct.name,
                            quantity: i.quantity,
                            unitPrice: i.unitPrice,
                            totalPrice: Number(i.unitPrice) * i.quantity,
                        })),
                    },
                },
                include: { items: true, vendor: true },
            });
            if (creditUsed > 0) {
                await tx.vendorCreditLine.update({
                    where: { vendorId_merchantProfileId: { vendorId, merchantProfileId: profile.id } },
                    data: { usedLimit: { increment: creditUsed } },
                });
            }
            for (const item of cart.items) {
                await tx.vendorInventory.updateMany({
                    where: { vendorProductId: item.vendorProductId },
                    data: { reservedQty: { increment: item.quantity } },
                });
            }
            await tx.procurementCartItem.deleteMany({ where: { cartId: cart.id } });
            return created;
        });
        return order;
    }
    async listOrders(userId, storeId) {
        const profile = await this.prisma.merchantProfile.findUnique({ where: { userId } });
        if (!profile)
            return [];
        return this.prisma.vendorOrder.findMany({
            where: { merchantProfileId: profile.id, ...(storeId ? { storeId } : {}) },
            include: {
                vendor: { select: { businessName: true, vendorType: true } },
                shipment: true,
                invoice: true,
                items: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
};
exports.ProcurementOrderService = ProcurementOrderService;
exports.ProcurementOrderService = ProcurementOrderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        procurement_cart_service_1.ProcurementCartService])
], ProcurementOrderService);
//# sourceMappingURL=procurement-order.service.js.map