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
exports.FleetAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const fleet_payout_util_1 = require("./fleet-payout.util");
let FleetAnalyticsService = class FleetAnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAdminFleetAnalytics() {
        const [onlineRiders, batches, routes, clusters] = await Promise.all([
            this.prisma.riderProfile.count({ where: { status: { in: ['ONLINE', 'ON_DELIVERY'] } } }),
            this.prisma.deliveryBatch.findMany({
                where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
                include: { items: true },
            }),
            this.prisma.routeOptimization.findMany({
                where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
                take: 200,
            }),
            this.prisma.riderCluster.findMany({ take: 20 }),
        ]);
        const totalDeliveries = await this.prisma.delivery.count({
            where: { status: 'DELIVERED', deliveredAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        });
        const avgBatchSize = batches.length > 0
            ? batches.reduce((s, b) => s + b.totalOrders, 0) / batches.length
            : 1;
        const routeEfficiency = routes.length > 0
            ? Math.round((routes.filter((r) => r.optimized).length / routes.length) * 100)
            : 0;
        const avgDistance = routes.length > 0 ? routes.reduce((s, r) => s + r.distanceKm, 0) / routes.length : 0;
        const samplePayout = (0, fleet_payout_util_1.computeFleetPayout)({
            baseEarning: 50,
            distanceKm: avgDistance || 3,
            batchSize: Math.round(avgBatchSize),
            optimized: routeEfficiency > 50,
        });
        const utilization = totalDeliveries > 0 && onlineRiders > 0
            ? Math.min(100, Math.round((totalDeliveries / (onlineRiders * 7)) * 10))
            : 0;
        return {
            riderUtilization: utilization,
            avgBatchSize: Math.round(avgBatchSize * 10) / 10,
            routeEfficiency,
            deliveryCostSavings: samplePayout.efficiencyBonus + samplePayout.batchBonus,
            clusterDemandRatios: clusters.map((c) => ({
                city: c.city,
                locality: c.locality,
                ratio: c.demandSupplyRatio,
            })),
            activeBatches: batches.filter((b) => b.status !== client_1.DeliveryBatchStatus.COMPLETED).length,
        };
    }
};
exports.FleetAnalyticsService = FleetAnalyticsService;
exports.FleetAnalyticsService = FleetAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FleetAnalyticsService);
//# sourceMappingURL=fleet-analytics.service.js.map