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
exports.RebalancingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const order_status_groups_1 = require("../order/order-status-groups");
let RebalancingService = class RebalancingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSuggestions(merchantProfileId) {
        const stores = await this.prisma.store.findMany({
            where: {
                merchantProfileId,
                status: client_1.StoreStatus.APPROVED,
                isActive: true,
                deletedAt: null,
            },
            select: { id: true, name: true },
        });
        if (stores.length < 2)
            return [];
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const suggestions = [];
        for (const store of stores) {
            const lowStockVariants = await this.prisma.productVariant.findMany({
                where: {
                    product: { storeId: store.id, isActive: true },
                    inventory: { availableQty: { lte: 5 } },
                },
                select: { sku: true, inventory: { select: { availableQty: true } } },
                take: 10,
            });
            for (const v of lowStockVariants) {
                const demand = await this.prisma.orderItem.count({
                    where: {
                        sku: v.sku,
                        order: {
                            storeId: store.id,
                            createdAt: { gte: sevenDaysAgo },
                            status: { notIn: [...order_status_groups_1.BUYER_STATUS_GROUPS.cancelled] },
                        },
                    },
                });
                if (demand < 3)
                    continue;
                const overstock = await this.findOverstockSource(merchantProfileId, store.id, v.sku);
                if (!overstock)
                    continue;
                const suggestedQty = Math.min(20, Math.max(5, demand));
                suggestions.push({
                    id: `${store.id}-${overstock.storeId}-${v.sku}`,
                    fromStoreId: overstock.storeId,
                    fromStoreName: overstock.storeName,
                    toStoreId: store.id,
                    toStoreName: store.name,
                    sku: v.sku,
                    suggestedQty,
                    reason: `High demand (${demand} orders/7d) with low stock at ${store.name}`,
                    expectedUpliftPct: Math.min(30, Math.round(demand * 3)),
                });
            }
        }
        if (suggestions.length > 0) {
            await this.prisma.fulfillmentAudit.create({
                data: {
                    action: client_1.FulfillmentAuditAction.REBALANCE_SUGGESTED,
                    metadata: { count: suggestions.length },
                },
            });
        }
        return suggestions.slice(0, 10);
    }
    async findOverstockSource(merchantProfileId, excludeStoreId, sku) {
        const variant = await this.prisma.productVariant.findFirst({
            where: {
                sku,
                product: {
                    store: { merchantProfileId, id: { not: excludeStoreId }, isActive: true },
                },
                inventory: { availableQty: { gte: 15 } },
            },
            include: { product: { include: { store: { select: { id: true, name: true } } } } },
        });
        if (!variant)
            return null;
        return { storeId: variant.product.store.id, storeName: variant.product.store.name };
    }
};
exports.RebalancingService = RebalancingService;
exports.RebalancingService = RebalancingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RebalancingService);
//# sourceMappingURL=rebalancing.service.js.map