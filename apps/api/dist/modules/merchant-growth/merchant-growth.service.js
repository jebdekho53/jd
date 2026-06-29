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
exports.MerchantGrowthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const merchant_dashboard_service_1 = require("../merchant-dashboard/merchant-dashboard.service");
const search_analytics_service_1 = require("../search-discovery/search-analytics.service");
const merchant_crm_service_1 = require("../crm/merchant-crm.service");
const store_health_service_1 = require("./store-health.service");
const growth_recommendations_service_1 = require("./growth-recommendations.service");
const growth_alert_service_1 = require("./growth-alert.service");
let MerchantGrowthService = class MerchantGrowthService {
    constructor(prisma, dashboard, health, recommendations, search, crm, alerts) {
        this.prisma = prisma;
        this.dashboard = dashboard;
        this.health = health;
        this.recommendations = recommendations;
        this.search = search;
        this.crm = crm;
        this.alerts = alerts;
    }
    async resolveStore(userId, storeId) {
        const ctx = await this.dashboard.resolveStoreContext(userId, storeId);
        const storeIdResolved = storeId ?? ctx.storeIds[0];
        if (!storeIdResolved)
            return null;
        return storeIdResolved;
    }
    async getOverview(userId, storeId) {
        const sid = await this.resolveStore(userId, storeId);
        if (!sid) {
            return {
                healthScore: 0,
                breakdown: {},
                metrics: {},
                actionCenter: [],
                alerts: [],
            };
        }
        const [health, inventory, search, productCount, alerts] = await Promise.all([
            this.health.computeForStore(sid, userId),
            this.dashboard.getInventory(userId, { storeId: sid }),
            this.search.getMerchantInsights(sid, '30d'),
            this.prisma.product.count({ where: { storeId: sid, deletedAt: null, isActive: true } }),
            this.alerts.listForStore(sid),
        ]);
        const hiddenLocalities = await this.estimateHiddenLocalities(sid);
        const actionCenter = this.recommendations.buildActionCenter(sid, health, {
            productCount,
            lowStockSkus: inventory.summary.lowStock,
            lostSearches: search.lostSearches,
            hiddenLocalities,
        });
        return {
            healthScore: health.score,
            breakdown: health.breakdown,
            metrics: health.metrics,
            inventoryHealth: inventory.summary,
            fulfillmentRate: health.metrics.fulfillmentRate,
            cancellationPct: health.metrics.cancellationRate,
            ratingTrend: health.metrics.ratingTrend,
            visibilityScore: health.metrics.visibilityScore,
            actionCenter,
            alerts,
        };
    }
    async getRecommendations(userId, storeId) {
        const sid = await this.resolveStore(userId, storeId);
        if (!sid)
            return { recommendations: [] };
        const health = await this.health.computeForStore(sid, userId);
        const search = await this.search.getMerchantInsights(sid, '30d');
        const recommendations = await this.recommendations.buildRecommendations(sid, health, search);
        return { recommendations };
    }
    async getVisibility(userId, storeId) {
        const sid = await this.resolveStore(userId, storeId);
        if (!sid)
            return { visibilityScore: 0, insights: null };
        const [health, insights, hiddenLocalities] = await Promise.all([
            this.health.computeForStore(sid, userId),
            this.search.getMerchantInsights(sid, '30d'),
            this.estimateHiddenLocalities(sid),
        ]);
        return {
            visibilityScore: health.metrics.visibilityScore,
            insights,
            hiddenLocalities,
            tips: [
                insights.impressions < 50 ? 'Add more products to improve search impressions' : null,
                insights.ctr < 3 ? 'Improve product images and titles for higher CTR' : null,
                hiddenLocalities.length > 0
                    ? `Expand delivery to ${hiddenLocalities.join(', ')}`
                    : null,
            ].filter(Boolean),
        };
    }
    async getOpportunities(userId, storeId) {
        const sid = await this.resolveStore(userId, storeId);
        if (!sid)
            return { revenue: [], expansion: [], retention: [] };
        const [crm, search, store] = await Promise.all([
            this.crm.getCustomers(userId, sid),
            this.search.getMerchantInsights(sid, '30d'),
            this.prisma.store.findUnique({
                where: { id: sid },
                select: { deliveryRadiusKm: true, city: { select: { name: true } } },
            }),
        ]);
        return {
            revenue: [
                {
                    title: 'Win-back dormant customers',
                    count: crm.winBack.length,
                    potential: '₹' + crm.winBack.length * 500,
                },
                {
                    title: 'Coupon users to convert',
                    count: crm.couponUsers.length,
                },
                ...search.lostSearches.slice(0, 5).map((l) => ({
                    title: `Capture "${l.query}" demand`,
                    count: l.count,
                    type: 'lost_search',
                })),
            ],
            expansion: [
                {
                    title: 'Increase delivery radius',
                    current: store?.deliveryRadiusKm ?? 5,
                    recommended: Math.min(10, (store?.deliveryRadiusKm ?? 5) + 2),
                    city: store?.city.name,
                },
                {
                    title: 'Area demand signals',
                    topSearches: search.topSearchedProducts.slice(0, 5),
                },
            ],
            retention: {
                repeatCustomers: crm.repeatCustomers.length,
                loyaltyMembers: crm.loyaltyMembers.length,
                topSpenders: crm.topSpenders.slice(0, 5),
            },
        };
    }
    async getBenchmark(userId, storeId) {
        const sid = await this.resolveStore(userId, storeId);
        if (!sid)
            return { store: null, platform: null };
        const store = await this.prisma.store.findUnique({
            where: { id: sid },
            select: { cityId: true },
        });
        const [health, platformAvg] = await Promise.all([
            this.health.computeForStore(sid, userId),
            this.prisma.storeHealthSnapshot.aggregate({
                _avg: { healthScore: true, visibilityScore: true, fulfillmentPct: true },
            }),
        ]);
        const cityAvg = store
            ? await this.prisma.storeHealthSnapshot.aggregate({
                where: { store: { cityId: store.cityId } },
                _avg: { healthScore: true },
            })
            : { _avg: { healthScore: null } };
        return {
            store: {
                healthScore: health.score,
                visibilityScore: health.metrics.visibilityScore,
                cancellationRate: health.metrics.cancellationRate,
                repeatCustomerPct: health.metrics.repeatCustomerPct,
            },
            platform: {
                avgHealthScore: Math.round(platformAvg._avg.healthScore ?? 0),
                avgVisibility: Math.round(platformAvg._avg.visibilityScore ?? 0),
                avgFulfillmentComponent: Math.round(platformAvg._avg.fulfillmentPct ?? 0),
            },
            city: {
                avgHealthScore: Math.round(cityAvg._avg.healthScore ?? 0),
            },
            percentile: health.score >= (platformAvg._avg.healthScore ?? 50) ? 'above_average' : 'below_average',
        };
    }
    async estimateHiddenLocalities(storeId) {
        const zones = await this.prisma.storeZone.findMany({
            where: { storeId },
            include: { zone: { select: { name: true } } },
        });
        if (zones.length === 0)
            return [];
        const lowImpressionZones = [];
        for (const sz of zones.slice(0, 10)) {
            const impressions = await this.prisma.searchEvent.count({
                where: {
                    storeId,
                    eventType: 'IMPRESSION',
                    createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
                    metadata: { path: ['zoneId'], equals: sz.zoneId },
                },
            });
            if (impressions < 5) {
                lowImpressionZones.push(sz.zone.name);
            }
        }
        return lowImpressionZones.slice(0, 5);
    }
};
exports.MerchantGrowthService = MerchantGrowthService;
exports.MerchantGrowthService = MerchantGrowthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        merchant_dashboard_service_1.MerchantDashboardService,
        store_health_service_1.StoreHealthService,
        growth_recommendations_service_1.GrowthRecommendationsService,
        search_analytics_service_1.SearchAnalyticsService,
        merchant_crm_service_1.MerchantCrmService,
        growth_alert_service_1.GrowthAlertService])
], MerchantGrowthService);
//# sourceMappingURL=merchant-growth.service.js.map