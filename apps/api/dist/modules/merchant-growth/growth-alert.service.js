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
var GrowthAlertService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrowthAlertService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const store_health_service_1 = require("./store-health.service");
const search_analytics_service_1 = require("../search-discovery/search-analytics.service");
const merchant_dashboard_service_1 = require("../merchant-dashboard/merchant-dashboard.service");
let GrowthAlertService = GrowthAlertService_1 = class GrowthAlertService {
    constructor(prisma, health, search, dashboard) {
        this.prisma = prisma;
        this.health = health;
        this.search = search;
        this.dashboard = dashboard;
        this.logger = new common_1.Logger(GrowthAlertService_1.name);
    }
    async listForStore(storeId, limit = 20) {
        return this.prisma.merchantGrowthAlert.findMany({
            where: { storeId, status: { in: [client_1.AnalyticsAlertStatus.OPEN, client_1.AnalyticsAlertStatus.ACKNOWLEDGED] } },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async evaluateAllStores() {
        const stores = await this.prisma.store.findMany({
            where: { status: 'APPROVED', isActive: true, deletedAt: null },
            select: { id: true, merchantProfile: { select: { userId: true } } },
            take: 200,
        });
        for (const store of stores) {
            const userId = store.merchantProfile.userId;
            try {
                await this.evaluateStore(store.id, userId);
            }
            catch (err) {
                this.logger.warn(`Growth alert eval failed for ${store.id}: ${err.message}`);
            }
        }
    }
    async evaluateStore(storeId, userId) {
        const result = await this.health.computeForStore(storeId, userId);
        const search = await this.search.getMerchantInsights(storeId, '7d');
        const analytics = await this.dashboard.getAnalytics(userId, { storeId, period: '7d' });
        const prior = await this.prisma.storeHealthSnapshot.findFirst({
            where: { storeId },
            orderBy: { snapshotDate: 'desc' },
            skip: 1,
        });
        if (prior && prior.healthScore - result.score >= 10) {
            await this.raise(storeId, client_1.MerchantGrowthAlertType.STORE_HEALTH_DROP, client_1.AnalyticsAlertSeverity.WARNING, 'Store health score dropped', `Health fell from ${prior.healthScore} to ${result.score}.`, { prior: prior.healthScore, current: result.score });
        }
        if (result.metrics.visibilityScore < 25) {
            await this.raise(storeId, client_1.MerchantGrowthAlertType.VISIBILITY_DROP, client_1.AnalyticsAlertSeverity.WARNING, 'Search visibility is low', `Visibility score ${result.metrics.visibilityScore}/100 — improve listings and stock.`, { visibilityScore: result.metrics.visibilityScore });
        }
        if (result.metrics.repeatCustomerPct < 15) {
            await this.raise(storeId, client_1.MerchantGrowthAlertType.LOW_REPEAT_CUSTOMERS, client_1.AnalyticsAlertSeverity.WARNING, 'Low repeat customer rate', `Only ${result.metrics.repeatCustomerPct}% repeat buyers — consider loyalty campaigns.`);
        }
        if (analytics.cancellationRate > 12) {
            await this.raise(storeId, client_1.MerchantGrowthAlertType.HIGH_CANCELLATION, client_1.AnalyticsAlertSeverity.CRITICAL, 'High cancellation rate', `Cancellation rate ${analytics.cancellationRate}% exceeds threshold.`, { cancellationRate: analytics.cancellationRate });
        }
        if (search.lostSearches.length >= 5) {
            await this.raise(storeId, client_1.MerchantGrowthAlertType.LOST_SEARCH_TRAFFIC, client_1.AnalyticsAlertSeverity.WARNING, 'Lost search traffic', `${search.lostSearches.length} high-intent searches with no matching products.`, { top: search.lostSearches.slice(0, 5) });
        }
    }
    async raise(storeId, alertType, severity, title, message, metadata) {
        const recent = await this.prisma.merchantGrowthAlert.findFirst({
            where: {
                storeId,
                alertType,
                status: client_1.AnalyticsAlertStatus.OPEN,
                createdAt: { gte: new Date(Date.now() - 6 * 3600000) },
            },
        });
        if (recent)
            return;
        await this.prisma.merchantGrowthAlert.create({
            data: {
                storeId,
                alertType,
                severity,
                title,
                message,
                metadata: metadata,
            },
        });
    }
};
exports.GrowthAlertService = GrowthAlertService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_6_HOURS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GrowthAlertService.prototype, "evaluateAllStores", null);
exports.GrowthAlertService = GrowthAlertService = GrowthAlertService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        store_health_service_1.StoreHealthService,
        search_analytics_service_1.SearchAnalyticsService,
        merchant_dashboard_service_1.MerchantDashboardService])
], GrowthAlertService);
//# sourceMappingURL=growth-alert.service.js.map