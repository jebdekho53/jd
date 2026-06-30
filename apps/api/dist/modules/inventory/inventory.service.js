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
var InventoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = exports.BUYER_LOW_STOCK_THRESHOLD = void 0;
exports.buyerStockLevel = buyerStockLevel;
exports.inventoryChangedException = inventoryChangedException;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const inventory_cache_service_1 = require("./inventory-cache.service");
const inventory_alert_service_1 = require("./inventory-alert.service");
exports.BUYER_LOW_STOCK_THRESHOLD = 10;
function buyerStockLevel(availableQty) {
    if (availableQty <= 0)
        return 'OUT_OF_STOCK';
    if (availableQty <= exports.BUYER_LOW_STOCK_THRESHOLD)
        return 'LOW_STOCK';
    return 'IN_STOCK';
}
function inventoryChangedException(message) {
    return new common_1.ConflictException({ code: 'INVENTORY_CHANGED', message });
}
let InventoryService = InventoryService_1 = class InventoryService {
    constructor(prisma, cache, alerts) {
        this.prisma = prisma;
        this.cache = cache;
        this.alerts = alerts;
        this.logger = new common_1.Logger(InventoryService_1.name);
    }
    getAvailableQty(inv) {
        if (!inv || inv.status === client_1.InventoryStatus.DISABLED)
            return 0;
        return Math.max(0, inv.availableQty);
    }
    async reserveForCheckout(checkoutId, items, expiresAt) {
        await this.prisma.$transaction(async (tx) => {
            for (const item of items) {
                const affected = await tx.$executeRaw `
          UPDATE inventory
          SET quantity = quantity - ${item.quantity},
              reserved = reserved + ${item.quantity},
              version = version + 1,
              status = CASE
                WHEN (quantity - ${item.quantity}) <= 0 THEN 'OUT_OF_STOCK'::"InventoryStatus"
                ELSE status
              END
          WHERE variant_id = ${item.variantId}
            AND status = 'ACTIVE'::"InventoryStatus"
            AND quantity >= ${item.quantity}
        `;
                if (affected === 0) {
                    const inv = await tx.inventory.findUnique({
                        where: { variantId: item.variantId },
                        select: { availableQty: true, status: true, reservedQty: true },
                    });
                    if (!inv) {
                        throw inventoryChangedException(`Inventory not found for variant ${item.variantId}`);
                    }
                    throw inventoryChangedException(`Only ${this.getAvailableQty(inv)} unit(s) available, ${item.quantity} requested`);
                }
                await tx.inventoryReservation.create({
                    data: {
                        checkoutId,
                        variantId: item.variantId,
                        productId: item.productId,
                        quantity: item.quantity,
                        status: client_1.ReservationStatus.ACTIVE,
                        expiresAt,
                    },
                });
            }
        });
        const variantIds = items.map((i) => i.variantId);
        await this.afterInventoryChange(variantIds);
    }
    async linkReservationsToOrder(checkoutId, orderId) {
        await this.prisma.inventoryReservation.updateMany({
            where: { checkoutId, status: client_1.ReservationStatus.ACTIVE },
            data: { orderId },
        });
    }
    async releaseByCheckout(checkoutId, reason) {
        const reservations = await this.prisma.inventoryReservation.findMany({
            where: { checkoutId, status: client_1.ReservationStatus.ACTIVE },
            select: { id: true, variantId: true, quantity: true, productId: true },
        });
        if (reservations.length === 0)
            return;
        const variantIds = [];
        await this.prisma.$transaction(async (tx) => {
            for (const res of reservations) {
                await tx.$executeRaw `
          UPDATE inventory
          SET quantity = quantity + ${res.quantity},
              reserved = GREATEST(0, reserved - ${res.quantity}),
              version = version + 1,
              status = CASE
                WHEN status = 'DISABLED'::"InventoryStatus" THEN status
                WHEN (quantity + ${res.quantity}) > 0 THEN 'ACTIVE'::"InventoryStatus"
                ELSE 'OUT_OF_STOCK'::"InventoryStatus"
              END
          WHERE variant_id = ${res.variantId}
        `;
                variantIds.push(res.variantId);
            }
            await tx.inventoryReservation.updateMany({
                where: { checkoutId, status: client_1.ReservationStatus.ACTIVE },
                data: {
                    status: reason === 'EXPIRED' ? client_1.ReservationStatus.EXPIRED : client_1.ReservationStatus.RELEASED,
                },
            });
        });
        await this.afterInventoryChange(variantIds);
    }
    async releaseByOrder(orderId) {
        const reservations = await this.prisma.inventoryReservation.findMany({
            where: { orderId, status: client_1.ReservationStatus.ACTIVE },
            select: { id: true, variantId: true, quantity: true },
        });
        if (reservations.length === 0)
            return;
        const variantIds = [];
        await this.prisma.$transaction(async (tx) => {
            for (const res of reservations) {
                await tx.$executeRaw `
          UPDATE inventory
          SET quantity = quantity + ${res.quantity},
              reserved = GREATEST(0, reserved - ${res.quantity}),
              version = version + 1,
              status = CASE
                WHEN status = 'DISABLED'::"InventoryStatus" THEN status
                WHEN (quantity + ${res.quantity}) > 0 THEN 'ACTIVE'::"InventoryStatus"
                ELSE 'OUT_OF_STOCK'::"InventoryStatus"
              END
          WHERE variant_id = ${res.variantId}
        `;
                variantIds.push(res.variantId);
            }
            await tx.inventoryReservation.updateMany({
                where: { orderId, status: client_1.ReservationStatus.ACTIVE },
                data: { status: client_1.ReservationStatus.RELEASED },
            });
        });
        await this.afterInventoryChange(variantIds);
    }
    async fulfillOnDelivery(orderId) {
        const reservations = await this.prisma.inventoryReservation.findMany({
            where: { orderId, status: client_1.ReservationStatus.ACTIVE },
            select: { id: true, variantId: true, quantity: true },
        });
        if (reservations.length === 0) {
            this.logger.warn({ orderId }, 'No active reservations to fulfill on delivery');
            return;
        }
        const variantIds = [];
        await this.prisma.$transaction(async (tx) => {
            for (const res of reservations) {
                await tx.$executeRaw `
          UPDATE inventory
          SET reserved = GREATEST(0, reserved - ${res.quantity}),
              sold_qty = sold_qty + ${res.quantity},
              version = version + 1,
              status = CASE
                WHEN status = 'DISABLED'::"InventoryStatus" THEN status
                WHEN quantity <= 0 AND GREATEST(0, reserved - ${res.quantity}) <= 0 THEN 'OUT_OF_STOCK'::"InventoryStatus"
                ELSE status
              END
          WHERE variant_id = ${res.variantId}
        `;
                variantIds.push(res.variantId);
            }
            await tx.inventoryReservation.updateMany({
                where: { orderId, status: client_1.ReservationStatus.ACTIVE },
                data: { status: client_1.ReservationStatus.CONSUMED },
            });
        });
        await this.afterInventoryChange(variantIds);
    }
    async adjustAvailableQty(variantId, newAvailableQty, lowStockThreshold, actorUserId) {
        if (newAvailableQty < 0) {
            throw inventoryChangedException('Available quantity cannot be negative');
        }
        const inv = await this.prisma.inventory.findUnique({ where: { variantId } });
        if (!inv)
            throw inventoryChangedException(`Inventory not found for variant ${variantId}`);
        const status = inv.status === client_1.InventoryStatus.DISABLED
            ? client_1.InventoryStatus.DISABLED
            : newAvailableQty <= 0
                ? client_1.InventoryStatus.OUT_OF_STOCK
                : client_1.InventoryStatus.ACTIVE;
        const updated = await this.prisma.inventory.update({
            where: { variantId },
            data: {
                availableQty: newAvailableQty,
                ...(lowStockThreshold !== undefined && { lowStockThreshold }),
                status,
                version: { increment: 1 },
            },
        });
        await this.afterInventoryChange([variantId]);
        if (actorUserId) {
            await this.alerts.checkAndNotifyLowStock(variantId, actorUserId);
        }
        return {
            availableQty: updated.availableQty,
            reservedQty: updated.reservedQty,
            soldQty: updated.soldQty,
            status: updated.status,
        };
    }
    async setStatus(variantId, status) {
        await this.prisma.inventory.update({
            where: { variantId },
            data: { status, version: { increment: 1 } },
        });
        await this.afterInventoryChange([variantId]);
    }
    async listStoreInventory(params) {
        const page = params.page ?? 1;
        const limit = Math.min(params.limit ?? 50, 100);
        const skip = (page - 1) * limit;
        const where = {
            storeId: params.storeId,
            deletedAt: null,
            ...(params.categoryId && { categoryId: params.categoryId }),
            ...(params.search && {
                OR: [
                    { name: { contains: params.search, mode: 'insensitive' } },
                    { sku: { contains: params.search, mode: 'insensitive' } },
                ],
            }),
            variants: {
                some: {
                    ...(params.outOfStock && { inventory: { availableQty: 0, status: { not: client_1.InventoryStatus.DISABLED } } }),
                    ...(params.lowStock && {
                        inventory: {
                            status: client_1.InventoryStatus.ACTIVE,
                            availableQty: { gt: 0 },
                        },
                    }),
                },
            },
        };
        const products = await this.prisma.product.findMany({
            where,
            include: {
                category: { select: { id: true, name: true } },
                variants: {
                    include: { inventory: true },
                    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
                },
            },
            orderBy: { name: 'asc' },
            skip,
            take: limit,
        });
        const rows = products.flatMap((p) => p.variants
            .filter((v) => v.inventory)
            .map((v) => {
            const inv = v.inventory;
            const available = this.getAvailableQty(inv);
            const isLow = available > 0 && available <= inv.lowStockThreshold;
            const isOut = available <= 0 || inv.status === client_1.InventoryStatus.OUT_OF_STOCK;
            if (params.lowStock && !isLow)
                return null;
            if (params.outOfStock && !isOut)
                return null;
            return {
                productId: p.id,
                productName: p.name,
                category: p.category,
                variantId: v.id,
                variantName: v.name,
                sku: v.sku,
                availableQty: available,
                reservedQty: inv.reservedQty,
                soldQty: inv.soldQty,
                lowStockThreshold: inv.lowStockThreshold,
                status: inv.status,
                stockLevel: buyerStockLevel(available),
                isActive: p.isActive && v.isActive,
            };
        })
            .filter(Boolean));
        return { items: rows, page, limit };
    }
    async listAdminInventory(params) {
        const page = params.page ?? 1;
        const limit = Math.min(params.limit ?? 50, 100);
        const skip = (page - 1) * limit;
        const where = {
            variant: {
                product: {
                    deletedAt: null,
                    store: {
                        deletedAt: null,
                        ...(params.storeId ? { id: params.storeId } : {}),
                    },
                },
            },
            ...(params.outOfStock
                ? { availableQty: { lte: 0 }, status: { not: client_1.InventoryStatus.DISABLED } }
                : {}),
            ...(params.lowStock
                ? { availableQty: { gt: 0, lte: this.prisma.inventory.fields.lowStockThreshold } }
                : {}),
        };
        const rows = await this.prisma.inventory.findMany({
            where,
            include: {
                variant: {
                    select: {
                        id: true,
                        sku: true,
                        product: {
                            select: {
                                id: true,
                                name: true,
                                fssaiLicense: true,
                                countryOfOrigin: true,
                                shelfLife: true,
                                store: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
            },
            orderBy: [{ availableQty: 'asc' }, { updatedAt: 'desc' }],
            skip,
            take: limit,
        });
        return {
            items: rows.map((r) => ({
                productId: r.variant.product.id,
                productName: r.variant.product.name,
                storeId: r.variant.product.store.id,
                storeName: r.variant.product.store.name,
                variantId: r.variant.id,
                sku: r.variant.sku,
                availableQty: r.availableQty,
                reservedQty: r.reservedQty,
                soldQty: r.soldQty,
                lowStockThreshold: r.lowStockThreshold,
                status: r.status,
                stockLevel: buyerStockLevel(r.availableQty),
                fssaiLicense: r.variant.product.fssaiLicense,
                countryOfOrigin: r.variant.product.countryOfOrigin,
                shelfLife: r.variant.product.shelfLife,
            })),
            page,
            limit,
        };
    }
    async getGlobalAnalytics() {
        const [totals, lowStock, topMoving, slowMoving] = await Promise.all([
            this.prisma.$queryRaw `
        SELECT
          COALESCE(SUM(i.quantity), 0) AS total_available,
          COALESCE(SUM(i.reserved), 0) AS total_reserved,
          COALESCE(SUM(i.sold_qty), 0) AS total_sold,
          COALESCE(SUM(i.quantity * v.price::numeric), 0) AS stock_value
        FROM inventory i
        JOIN product_variants v ON v.id = i.variant_id
        JOIN products p ON p.id = v.product_id AND p.deleted_at IS NULL
      `,
            this.prisma.inventory.count({
                where: {
                    status: client_1.InventoryStatus.ACTIVE,
                    availableQty: { lte: 5 },
                },
            }),
            this.prisma.inventory.findMany({
                orderBy: { soldQty: 'desc' },
                take: 10,
                include: {
                    variant: {
                        select: {
                            sku: true,
                            product: { select: { id: true, name: true, store: { select: { name: true } } } },
                        },
                    },
                },
            }),
            this.prisma.inventory.findMany({
                where: { soldQty: 0, availableQty: { gt: 0 } },
                orderBy: { availableQty: 'desc' },
                take: 10,
                include: {
                    variant: {
                        select: {
                            sku: true,
                            product: { select: { id: true, name: true, store: { select: { name: true } } } },
                        },
                    },
                },
            }),
        ]);
        const t = totals[0];
        return {
            totalAvailable: Number(t?.total_available ?? 0),
            totalReserved: Number(t?.total_reserved ?? 0),
            totalSold: Number(t?.total_sold ?? 0),
            stockValue: Number(t?.stock_value ?? 0),
            lowStockCount: lowStock,
            fastMoving: topMoving.map((i) => ({
                productName: i.variant.product.name,
                storeName: i.variant.product.store.name,
                sku: i.variant.sku,
                soldQty: i.soldQty,
                availableQty: i.availableQty,
            })),
            slowMoving: slowMoving.map((i) => ({
                productName: i.variant.product.name,
                storeName: i.variant.product.store.name,
                sku: i.variant.sku,
                availableQty: i.availableQty,
            })),
        };
    }
    async afterInventoryChange(variantIds) {
        if (variantIds.length === 0)
            return;
        const products = await this.prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            select: { product: { select: { storeId: true } } },
        });
        const storeIds = [...new Set(products.map((p) => p.product.storeId))];
        await this.cache.invalidateForStores(storeIds);
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = InventoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        inventory_cache_service_1.InventoryCacheService,
        inventory_alert_service_1.InventoryAlertService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map