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
exports.AdminFulfillmentNetworkService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let AdminFulfillmentNetworkService = class AdminFulfillmentNetworkService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboard() {
        const [networks, darkStores, transfers, splitOrders, totalOrders] = await Promise.all([
            this.prisma.storeNetwork.count({ where: { isActive: true } }),
            this.prisma.store.count({ where: { storeType: client_1.StoreType.DARK_STORE, isActive: true } }),
            this.prisma.inventoryTransfer.count({
                where: { status: { in: [client_1.InventoryTransferStatus.REQUESTED, client_1.InventoryTransferStatus.IN_TRANSIT] } },
            }),
            this.prisma.order.count({ where: { isSplitFulfillment: true } }),
            this.prisma.order.count(),
        ]);
        const recentAudits = await this.prisma.fulfillmentAudit.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { store: { select: { name: true } }, order: { select: { orderNumber: true } } },
        });
        return {
            activeNetworks: networks,
            darkStores,
            pendingTransfers: transfers,
            splitOrderRatio: totalOrders > 0 ? Math.round((splitOrders / totalOrders) * 100) : 0,
            recentActivity: recentAudits,
        };
    }
    async listTransfers() {
        return this.prisma.inventoryTransfer.findMany({
            include: {
                items: true,
                fromStore: { select: { name: true, storeType: true } },
                toStore: { select: { name: true, storeType: true } },
            },
            orderBy: { requestedAt: 'desc' },
            take: 50,
        });
    }
    async getCapacityHeatmap() {
        const snapshots = await this.prisma.storeCapacitySnapshot.findMany({
            orderBy: { snapshotAt: 'desc' },
            distinct: ['storeId'],
            take: 100,
            include: { store: { select: { id: true, name: true, storeType: true, latitude: true, longitude: true } } },
        });
        return snapshots.map((s) => ({
            storeId: s.storeId,
            storeName: s.store.name,
            storeType: s.store.storeType,
            lat: s.store.latitude,
            lng: s.store.longitude,
            currentLoadPct: s.currentLoadPct,
            peakLoadPct: s.peakLoadPct,
            backlogCount: s.backlogCount,
        }));
    }
    async getSlaMetrics() {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const fulfillmentOrders = await this.prisma.fulfillmentOrder.findMany({
            where: { createdAt: { gte: sevenDaysAgo }, etaMins: { not: null } },
            select: { etaMins: true, status: true },
        });
        const onTime = fulfillmentOrders.filter((f) => f.status === client_1.FulfillmentOrderStatus.COMPLETED || f.status === client_1.FulfillmentOrderStatus.DISPATCHED).length;
        const total = fulfillmentOrders.length;
        const avgEta = total > 0 ? Math.round(fulfillmentOrders.reduce((s, f) => s + (f.etaMins ?? 0), 0) / total) : 0;
        const delivered = await this.prisma.order.count({
            where: { status: client_1.OrderStatus.DELIVERED, createdAt: { gte: sevenDaysAgo } },
        });
        return {
            fulfillmentSlaPct: total > 0 ? Math.round((onTime / total) * 100) : 100,
            avgEtaMins: avgEta,
            ordersDelivered7d: delivered,
            pickTimeMins: 8,
            packTimeMins: 5,
        };
    }
};
exports.AdminFulfillmentNetworkService = AdminFulfillmentNetworkService;
exports.AdminFulfillmentNetworkService = AdminFulfillmentNetworkService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminFulfillmentNetworkService);
//# sourceMappingURL=admin-fulfillment-network.service.js.map