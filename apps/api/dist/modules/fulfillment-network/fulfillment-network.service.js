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
exports.FulfillmentNetworkService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const merchant_dashboard_service_1 = require("../merchant-dashboard/merchant-dashboard.service");
const capacity_service_1 = require("./capacity.service");
const rebalancing_service_1 = require("./rebalancing.service");
let FulfillmentNetworkService = class FulfillmentNetworkService {
    constructor(prisma, merchantDashboard, capacity, rebalancing) {
        this.prisma = prisma;
        this.merchantDashboard = merchantDashboard;
        this.capacity = capacity;
        this.rebalancing = rebalancing;
    }
    async getOverview(userId, storeId) {
        const ctx = await this.merchantDashboard.resolveStoreContext(userId, storeId);
        if (!ctx.merchantProfileId) {
            return { stores: [], darkStores: 0, warehouses: 0, splitOrderRatio: 0, networkName: null };
        }
        const network = await this.prisma.storeNetwork.findFirst({
            where: { merchantProfileId: ctx.merchantProfileId, isActive: true },
            include: {
                hubs: {
                    include: {
                        store: {
                            select: { id: true, name: true, storeType: true, isActive: true, latitude: true, longitude: true },
                        },
                    },
                },
            },
        });
        const storeIds = storeId ? [storeId] : ctx.storeIds;
        const stores = network
            ? network.hubs.map((h) => h.store).filter((s) => storeIds.includes(s.id))
            : await this.prisma.store.findMany({
                where: { id: { in: storeIds } },
                select: { id: true, name: true, storeType: true, isActive: true, latitude: true, longitude: true },
            });
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [totalOrders, splitOrders] = await Promise.all([
            this.prisma.order.count({
                where: { storeId: { in: storeIds }, createdAt: { gte: thirtyDaysAgo } },
            }),
            this.prisma.order.count({
                where: { storeId: { in: storeIds }, isSplitFulfillment: true, createdAt: { gte: thirtyDaysAgo } },
            }),
        ]);
        return {
            networkName: network?.name ?? 'Default Network',
            stores,
            darkStores: stores.filter((s) => s.storeType === client_1.StoreType.DARK_STORE).length,
            warehouses: stores.filter((s) => s.storeType === client_1.StoreType.WAREHOUSE).length,
            microFulfillment: stores.filter((s) => s.storeType === client_1.StoreType.MICRO_FULFILLMENT_CENTER).length,
            splitOrderRatio: totalOrders > 0 ? Math.round((splitOrders / totalOrders) * 100) : 0,
        };
    }
    async getCapacity(userId, storeId) {
        const ctx = await this.merchantDashboard.resolveStoreContext(userId, storeId);
        const storeIds = storeId ? [storeId] : ctx.storeIds;
        const rows = await this.capacity.listNetworkCapacity(storeIds);
        return rows.map((r) => ({
            storeId: r.storeId,
            ordersPerHour: r.snapshot?.ordersPerHour ?? 0,
            pickersAvailable: r.snapshot?.pickersAvailable ?? 0,
            packingStations: r.snapshot?.packingStations ?? 0,
            currentLoadPct: r.snapshot?.currentLoadPct ?? 0,
            peakLoadPct: r.snapshot?.peakLoadPct ?? 0,
            backlogCount: r.snapshot?.backlogCount ?? 0,
        }));
    }
    async getTransfers(userId, storeId) {
        return this.prisma.inventoryTransfer.findMany({
            where: {
                ...(storeId
                    ? { OR: [{ fromStoreId: storeId }, { toStoreId: storeId }] }
                    : {}),
            },
            include: {
                items: true,
                fromStore: { select: { name: true, storeType: true } },
                toStore: { select: { name: true, storeType: true } },
            },
            orderBy: { requestedAt: 'desc' },
            take: 20,
        });
    }
    async getRebalancing(userId, storeId) {
        const ctx = await this.merchantDashboard.resolveStoreContext(userId, storeId);
        if (!ctx.merchantProfileId)
            return [];
        return this.rebalancing.getSuggestions(ctx.merchantProfileId);
    }
    async getPerformance(userId, storeId) {
        const ctx = await this.merchantDashboard.resolveStoreContext(userId, storeId);
        const storeIds = storeId ? [storeId] : ctx.storeIds;
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [fulfillmentOrders, delivered, transfers] = await Promise.all([
            this.prisma.fulfillmentOrder.count({
                where: { fulfillmentStoreId: { in: storeIds }, createdAt: { gte: sevenDaysAgo } },
            }),
            this.prisma.fulfillmentOrder.count({
                where: {
                    fulfillmentStoreId: { in: storeIds },
                    status: client_1.FulfillmentOrderStatus.COMPLETED,
                    createdAt: { gte: sevenDaysAgo },
                },
            }),
            this.prisma.inventoryTransfer.count({
                where: {
                    merchantProfileId: ctx.merchantProfileId ?? undefined,
                    status: 'RECEIVED',
                    completedAt: { gte: sevenDaysAgo },
                },
            }),
        ]);
        const darkStoreOrders = await this.prisma.fulfillmentOrder.count({
            where: {
                fulfillmentStore: { storeType: client_1.StoreType.DARK_STORE, id: { in: storeIds } },
                createdAt: { gte: sevenDaysAgo },
            },
        });
        return {
            fulfillmentAccuracy: fulfillmentOrders > 0 ? Math.round((delivered / fulfillmentOrders) * 100) : 100,
            transferSuccessRate: transfers,
            darkStorePerformance: darkStoreOrders,
            avgPickTimeMins: 8,
            avgPackTimeMins: 5,
            capacityUtilization: 0,
        };
    }
};
exports.FulfillmentNetworkService = FulfillmentNetworkService;
exports.FulfillmentNetworkService = FulfillmentNetworkService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        merchant_dashboard_service_1.MerchantDashboardService,
        capacity_service_1.CapacityService,
        rebalancing_service_1.RebalancingService])
], FulfillmentNetworkService);
//# sourceMappingURL=fulfillment-network.service.js.map