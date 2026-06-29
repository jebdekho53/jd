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
exports.InventoryTransferService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const merchant_dashboard_service_1 = require("../merchant-dashboard/merchant-dashboard.service");
let InventoryTransferService = class InventoryTransferService {
    constructor(prisma, merchantDashboard) {
        this.prisma = prisma;
        this.merchantDashboard = merchantDashboard;
    }
    async createTransfer(userId, dto) {
        const ctx = await this.merchantDashboard.resolveStoreContext(userId, dto.fromStoreId);
        if (!ctx.merchantProfileId)
            throw new common_1.ForbiddenException('Merchant profile required');
        if (!ctx.storeIds.includes(dto.fromStoreId) || !ctx.storeIds.includes(dto.toStoreId)) {
            throw new common_1.ForbiddenException('Stores must belong to your merchant account');
        }
        if (dto.fromStoreId === dto.toStoreId) {
            throw new common_1.BadRequestException('Source and destination must differ');
        }
        const transfer = await this.prisma.inventoryTransfer.create({
            data: {
                merchantProfileId: ctx.merchantProfileId,
                fromStoreId: dto.fromStoreId,
                toStoreId: dto.toStoreId,
                requestedBy: userId,
                notes: dto.notes,
                items: {
                    create: dto.items.map((i) => ({ variantId: i.variantId, sku: i.sku, quantity: i.quantity })),
                },
            },
            include: { items: true, fromStore: { select: { name: true } }, toStore: { select: { name: true } } },
        });
        await this.prisma.fulfillmentAudit.create({
            data: {
                storeId: dto.fromStoreId,
                action: client_1.FulfillmentAuditAction.TRANSFER_REQUESTED,
                metadata: { transferId: transfer.id },
            },
        });
        return transfer;
    }
    async listTransfers(userId, storeId) {
        const ctx = await this.merchantDashboard.resolveStoreContext(userId, storeId);
        if (!ctx.merchantProfileId)
            return [];
        return this.prisma.inventoryTransfer.findMany({
            where: {
                merchantProfileId: ctx.merchantProfileId,
                ...(storeId ? { OR: [{ fromStoreId: storeId }, { toStoreId: storeId }] } : {}),
            },
            include: {
                items: true,
                fromStore: { select: { id: true, name: true, storeType: true } },
                toStore: { select: { id: true, name: true, storeType: true } },
            },
            orderBy: { requestedAt: 'desc' },
            take: 50,
        });
    }
    async approveTransfer(userId, transferId) {
        const transfer = await this.getOwnedTransfer(userId, transferId);
        if (transfer.status !== client_1.InventoryTransferStatus.REQUESTED) {
            throw new common_1.BadRequestException('Only REQUESTED transfers can be approved');
        }
        const updated = await this.prisma.inventoryTransfer.update({
            where: { id: transferId },
            data: { status: client_1.InventoryTransferStatus.APPROVED, approvedBy: userId, approvedAt: new Date() },
            include: { items: true },
        });
        await this.prisma.fulfillmentAudit.create({
            data: {
                storeId: transfer.fromStoreId,
                action: client_1.FulfillmentAuditAction.TRANSFER_APPROVED,
                metadata: { transferId },
            },
        });
        return updated;
    }
    async completeTransfer(userId, transferId) {
        const transfer = await this.getOwnedTransfer(userId, transferId);
        if (transfer.status !== client_1.InventoryTransferStatus.APPROVED &&
            transfer.status !== client_1.InventoryTransferStatus.IN_TRANSIT) {
            throw new common_1.BadRequestException('Transfer must be APPROVED or IN_TRANSIT to complete');
        }
        await this.prisma.$transaction(async (tx) => {
            for (const item of transfer.items) {
                const sourceInv = await tx.inventory.findFirst({
                    where: { variantId: item.variantId },
                });
                if (!sourceInv || sourceInv.availableQty < item.quantity) {
                    throw new common_1.BadRequestException(`Insufficient stock for SKU ${item.sku}`);
                }
                await tx.inventory.update({
                    where: { id: sourceInv.id },
                    data: { availableQty: { decrement: item.quantity } },
                });
                const destVariant = await tx.productVariant.findFirst({
                    where: {
                        sku: item.sku,
                        product: { storeId: transfer.toStoreId },
                        isActive: true,
                    },
                    include: { inventory: true },
                });
                if (destVariant?.inventory) {
                    await tx.inventory.update({
                        where: { id: destVariant.inventory.id },
                        data: { availableQty: { increment: item.quantity } },
                    });
                }
            }
            await tx.inventoryTransfer.update({
                where: { id: transferId },
                data: { status: client_1.InventoryTransferStatus.RECEIVED, completedAt: new Date() },
            });
        });
        await this.prisma.fulfillmentAudit.create({
            data: {
                storeId: transfer.toStoreId,
                action: client_1.FulfillmentAuditAction.TRANSFER_COMPLETED,
                metadata: { transferId },
            },
        });
        return this.prisma.inventoryTransfer.findUnique({
            where: { id: transferId },
            include: { items: true },
        });
    }
    async getOwnedTransfer(userId, transferId) {
        const transfer = await this.prisma.inventoryTransfer.findUnique({
            where: { id: transferId },
            include: { items: true },
        });
        if (!transfer)
            throw new common_1.NotFoundException('Transfer not found');
        const ctx = await this.merchantDashboard.resolveStoreContext(userId);
        if (!ctx.merchantProfileId || transfer.merchantProfileId !== ctx.merchantProfileId) {
            throw new common_1.ForbiddenException('Transfer not found');
        }
        return transfer;
    }
};
exports.InventoryTransferService = InventoryTransferService;
exports.InventoryTransferService = InventoryTransferService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        merchant_dashboard_service_1.MerchantDashboardService])
], InventoryTransferService);
//# sourceMappingURL=inventory-transfer.service.js.map