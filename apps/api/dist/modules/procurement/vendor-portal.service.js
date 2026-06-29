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
exports.VendorPortalService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../database/prisma.service");
let VendorPortalService = class VendorPortalService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async resolveVendorId(userId) {
        const profile = await this.prisma.vendorProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.ForbiddenException('Vendor profile required');
        return profile.vendorId;
    }
    async listOrders(userId) {
        const vendorId = await this.resolveVendorId(userId);
        return this.prisma.vendorOrder.findMany({
            where: { vendorId },
            include: { items: true, shipment: true, invoice: true },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async shipOrder(userId, orderId, dto) {
        const vendorId = await this.resolveVendorId(userId);
        const order = await this.prisma.vendorOrder.findFirst({ where: { id: orderId, vendorId } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.status !== client_1.VendorOrderStatus.CONFIRMED && order.status !== client_1.VendorOrderStatus.PENDING) {
            throw new common_1.BadRequestException('Order cannot be shipped in current status');
        }
        await this.prisma.$transaction([
            this.prisma.vendorOrder.update({
                where: { id: orderId },
                data: { status: client_1.VendorOrderStatus.SHIPPED },
            }),
            this.prisma.vendorShipment.upsert({
                where: { vendorOrderId: orderId },
                create: {
                    vendorOrderId: orderId,
                    status: client_1.VendorShipmentStatus.IN_TRANSIT,
                    carrier: dto.carrier,
                    trackingNumber: dto.trackingNumber,
                    shippedAt: new Date(),
                },
                update: {
                    status: client_1.VendorShipmentStatus.IN_TRANSIT,
                    carrier: dto.carrier,
                    trackingNumber: dto.trackingNumber,
                    shippedAt: new Date(),
                },
            }),
        ]);
        return this.prisma.vendorOrder.findUnique({
            where: { id: orderId },
            include: { shipment: true },
        });
    }
    async deliverOrder(userId, orderId) {
        const vendorId = await this.resolveVendorId(userId);
        const order = await this.prisma.vendorOrder.findFirst({ where: { id: orderId, vendorId } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const invoiceNumber = `VI-${(0, crypto_1.randomBytes)(4).toString('hex').toUpperCase()}`;
        const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await this.prisma.$transaction(async (tx) => {
            await tx.vendorOrder.update({
                where: { id: orderId },
                data: { status: client_1.VendorOrderStatus.DELIVERED },
            });
            await tx.vendorShipment.update({
                where: { vendorOrderId: orderId },
                data: { status: client_1.VendorShipmentStatus.DELIVERED, deliveredAt: new Date() },
            });
            await tx.vendorInvoice.upsert({
                where: { vendorOrderId: orderId },
                create: {
                    vendorOrderId: orderId,
                    invoiceNumber,
                    status: client_1.VendorInvoiceStatus.ISSUED,
                    subtotal: order.subtotal,
                    taxAmount: order.taxAmount,
                    totalAmount: order.totalAmount,
                    dueDate,
                },
                update: { status: client_1.VendorInvoiceStatus.ISSUED },
            });
            for (const item of await tx.vendorOrderItem.findMany({ where: { vendorOrderId: orderId } })) {
                await tx.vendorInventory.updateMany({
                    where: { vendorProductId: item.vendorProductId },
                    data: {
                        reservedQty: { decrement: item.quantity },
                        availableQty: { decrement: item.quantity },
                    },
                });
            }
        });
        return this.prisma.vendorOrder.findUnique({
            where: { id: orderId },
            include: { invoice: true, shipment: true },
        });
    }
    async getCatalog(userId) {
        const vendorId = await this.resolveVendorId(userId);
        return this.prisma.vendorCatalog.findMany({
            where: { vendorId },
            include: {
                products: {
                    include: { inventory: true, priceTiers: true },
                    orderBy: { name: 'asc' },
                },
            },
        });
    }
    async createProduct(userId, dto) {
        const vendorId = await this.resolveVendorId(userId);
        const catalog = await this.prisma.vendorCatalog.findFirst({
            where: { id: dto.catalogId, vendorId },
        });
        if (!catalog)
            throw new common_1.NotFoundException('Catalog not found');
        const product = await this.prisma.vendorProduct.create({
            data: {
                vendorId,
                catalogId: dto.catalogId,
                name: dto.name,
                sku: dto.sku,
                description: dto.description,
                category: dto.category,
                hsnCode: dto.hsnCode,
                gstRate: dto.gstRate ?? 0,
                basePrice: dto.basePrice,
                moq: dto.moq ?? 1,
                leadTimeDays: dto.leadTimeDays ?? 3,
                inventory: {
                    create: { availableQty: dto.availableQty ?? 0 },
                },
            },
            include: { inventory: true },
        });
        return product;
    }
};
exports.VendorPortalService = VendorPortalService;
exports.VendorPortalService = VendorPortalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VendorPortalService);
//# sourceMappingURL=vendor-portal.service.js.map