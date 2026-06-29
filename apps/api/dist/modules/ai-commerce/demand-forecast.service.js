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
var DemandForecastService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandForecastService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const ist_day_util_1 = require("../../common/utils/ist-day.util");
const demand_forecast_util_1 = require("./demand-forecast.util");
const order_status_groups_1 = require("../order/order-status-groups");
let DemandForecastService = DemandForecastService_1 = class DemandForecastService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(DemandForecastService_1.name);
    }
    async runForecastsForStore(storeId) {
        const products = await this.prisma.product.findMany({
            where: { storeId, isActive: true, deletedAt: null },
            select: { id: true },
            take: 100,
        });
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        let count = 0;
        for (const product of products) {
            for (const horizon of [1, 7]) {
                const forecastDate = new Date((0, ist_day_util_1.startOfIstDay)(now).getTime() + horizon * 24 * 60 * 60 * 1000);
                const [orderQty7d, orderQty30d, searchHits7d, cartAdds7d, campaignBoost] = await Promise.all([
                    this.orderQty(storeId, product.id, sevenDaysAgo),
                    this.orderQty(storeId, product.id, thirtyDaysAgo),
                    this.prisma.searchEvent.count({
                        where: { createdAt: { gte: sevenDaysAgo }, productId: product.id },
                    }),
                    this.prisma.cartItem.count({
                        where: { productId: product.id, cart: { storeId }, createdAt: { gte: sevenDaysAgo } },
                    }),
                    this.campaignBoost(storeId),
                ]);
                const result = (0, demand_forecast_util_1.predictDemand)({ orderQty7d, orderQty30d, searchHits7d, cartAdds7d, campaignBoost }, horizon);
                await this.prisma.demandForecast.upsert({
                    where: {
                        storeId_productId_forecastDate: {
                            storeId,
                            productId: product.id,
                            forecastDate,
                        },
                    },
                    update: {
                        predictedDemand: result.predictedDemand,
                        confidenceScore: result.confidenceScore,
                    },
                    create: {
                        storeId,
                        productId: product.id,
                        forecastDate,
                        predictedDemand: result.predictedDemand,
                        confidenceScore: result.confidenceScore,
                    },
                });
                count++;
            }
        }
        this.logger.log(`Generated ${count} demand forecasts for store ${storeId}`);
        return count;
    }
    async runAllForecasts() {
        const stores = await this.prisma.store.findMany({
            where: { isActive: true, status: 'APPROVED' },
            select: { id: true },
            take: 50,
        });
        let total = 0;
        for (const s of stores) {
            total += await this.runForecastsForStore(s.id);
        }
        return total;
    }
    async getMerchantForecasts(storeIds) {
        const tomorrow = new Date((0, ist_day_util_1.startOfIstDay)().getTime() + 24 * 60 * 60 * 1000);
        const week = new Date((0, ist_day_util_1.startOfIstDay)().getTime() + 7 * 24 * 60 * 60 * 1000);
        return this.prisma.demandForecast.findMany({
            where: { storeId: { in: storeIds }, forecastDate: { in: [tomorrow, week] } },
            include: { product: { select: { id: true, name: true } } },
            orderBy: { predictedDemand: 'desc' },
            take: 50,
        });
    }
    async getAdminForecasts() {
        return this.prisma.demandForecast.findMany({
            include: {
                store: { select: { name: true } },
                product: { select: { name: true } },
            },
            orderBy: { forecastDate: 'asc' },
            take: 100,
        });
    }
    async getForecastAccuracy() {
        const rows = await this.prisma.demandForecast.findMany({
            where: { actualDemand: { not: null } },
            take: 200,
        });
        if (rows.length === 0)
            return { accuracyPct: 0, samples: 0 };
        const errors = rows.map((r) => {
            const actual = r.actualDemand ?? 0;
            const predicted = r.predictedDemand;
            return actual > 0 ? Math.abs(actual - predicted) / actual : predicted > 0 ? 1 : 0;
        });
        const mape = errors.reduce((s, e) => s + e, 0) / errors.length;
        return { accuracyPct: Math.round((1 - mape) * 100), samples: rows.length };
    }
    async orderQty(storeId, productId, since) {
        const agg = await this.prisma.orderItem.aggregate({
            where: {
                productId,
                order: {
                    storeId,
                    createdAt: { gte: since },
                    status: { notIn: [...order_status_groups_1.BUYER_STATUS_GROUPS.cancelled] },
                },
            },
            _sum: { quantity: true },
        });
        return agg._sum.quantity ?? 0;
    }
    async campaignBoost(storeId) {
        const active = await this.prisma.storePromotion.count({
            where: { storeId, isActive: true, expiresAt: { gte: new Date() } },
        });
        return Math.min(0.3, active * 0.05);
    }
};
exports.DemandForecastService = DemandForecastService;
exports.DemandForecastService = DemandForecastService = DemandForecastService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DemandForecastService);
//# sourceMappingURL=demand-forecast.service.js.map