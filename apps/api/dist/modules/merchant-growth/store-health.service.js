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
exports.StoreHealthService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const ist_day_util_1 = require("../../common/utils/ist-day.util");
const store_reputation_service_1 = require("../store-review/store-reputation.service");
const merchant_dashboard_service_1 = require("../merchant-dashboard/merchant-dashboard.service");
const search_analytics_service_1 = require("../search-discovery/search-analytics.service");
const merchant_crm_service_1 = require("../crm/merchant-crm.service");
let StoreHealthService = class StoreHealthService {
    constructor(prisma, reputation, dashboard, searchAnalytics, merchantCrm) {
        this.prisma = prisma;
        this.reputation = reputation;
        this.dashboard = dashboard;
        this.searchAnalytics = searchAnalytics;
        this.merchantCrm = merchantCrm;
    }
    async computeForStore(storeId, userId) {
        const since90 = new Date(Date.now() - 90 * 86400000);
        const since30 = new Date(Date.now() - 30 * 86400000);
        const [reputation, inventory, , search, crm, deliveries, campaigns, orders] = await Promise.all([
            this.reputation.getStoreReputation(storeId),
            this.dashboard.getInventory(userId, { storeId }),
            this.dashboard.getAnalytics(userId, { storeId, period: '30d' }),
            this.searchAnalytics.getMerchantInsights(storeId, '30d'),
            this.merchantCrm.getCustomers(userId, storeId),
            this.prisma.delivery.findMany({
                where: {
                    order: { storeId, createdAt: { gte: since30 } },
                    deliveredAt: { not: null },
                },
                select: { estimatedMins: true, assignedAt: true, deliveredAt: true },
                take: 200,
            }),
            this.prisma.campaign.findMany({
                where: { storeId, status: { in: [client_1.CampaignStatus.ACTIVE, client_1.CampaignStatus.PAUSED, client_1.CampaignStatus.ENDED] } },
                select: { impressionCount: true, clickCount: true, orderCount: true },
            }),
            this.prisma.order.findMany({
                where: { storeId, createdAt: { gte: since90 } },
                select: { status: true },
            }),
        ]);
        const totalOrders = orders.length;
        const fulfilled = orders.filter((o) => o.status === client_1.OrderStatus.DELIVERED || o.status === client_1.OrderStatus.COMPLETED).length;
        const cancelled = orders.filter((o) => String(o.status).startsWith('CANCELLED')).length;
        const fulfillmentRate = totalOrders > 0 ? fulfilled / totalOrders : 1;
        const cancellationRate = totalOrders > 0 ? cancelled / totalOrders : 0;
        const fulfillmentScore = Math.round(fulfillmentRate * 30);
        const ratingsScore = Math.round((reputation.averageRating / 5) * 20);
        const inv = inventory.summary;
        const stockHealth = inv.totalProducts > 0
            ? 1 - (inv.lowStock + inv.outOfStock) / Math.max(inv.totalProducts, 1)
            : 0.5;
        const inventoryScore = Math.round(Math.max(0, Math.min(1, stockHealth)) * 15);
        const repeatCount = crm.repeatCustomers.length;
        const topCount = crm.topSpenders.length;
        const retentionRate = topCount > 0 ? Math.min(1, repeatCount / topCount) : 0;
        const retentionScore = Math.round(retentionRate * 15);
        const slaTargetMins = 45;
        const onTime = deliveries.filter((d) => {
            if (!d.deliveredAt || !d.assignedAt)
                return true;
            const mins = (d.deliveredAt.getTime() - d.assignedAt.getTime()) / 60000;
            return mins <= slaTargetMins;
        }).length;
        const deliverySlaPct = deliveries.length > 0 ? (onTime / deliveries.length) * 100 : 100;
        const deliverySlaScore = Math.round((deliverySlaPct / 100) * 10);
        const campaignImpressions = campaigns.reduce((s, c) => s + c.impressionCount, 0);
        const campaignOrders = campaigns.reduce((s, c) => s + c.orderCount, 0);
        const campaignActivityPct = campaigns.length > 0
            ? Math.min(100, campaigns.length * 20 + (campaignImpressions > 0 ? 30 : 0) + (campaignOrders > 0 ? 20 : 0))
            : 0;
        const campaignScore = Math.round((campaignActivityPct / 100) * 10);
        const visibilityScore = Math.min(100, Math.round((search.impressions > 0 ? search.ctr * 2 : 0) +
            (search.conversionRate * 3) +
            Math.min(40, search.impressions / 10)));
        const score = Math.min(100, fulfillmentScore +
            ratingsScore +
            inventoryScore +
            retentionScore +
            deliverySlaScore +
            campaignScore);
        const priorSnapshot = await this.prisma.storeHealthSnapshot.findFirst({
            where: { storeId },
            orderBy: { snapshotDate: 'desc' },
            skip: 1,
        });
        let ratingTrend = 'stable';
        if (priorSnapshot) {
            if (reputation.averageRating > (priorSnapshot.ratingsPct / 20) * 5 + 0.1)
                ratingTrend = 'up';
            else if (reputation.averageRating < (priorSnapshot.ratingsPct / 20) * 5 - 0.1)
                ratingTrend = 'down';
        }
        const avgDeliveryMins = deliveries.length > 0
            ? deliveries.reduce((s, d) => s + (d.estimatedMins ?? 30), 0) / deliveries.length
            : 30;
        const today = (0, ist_day_util_1.startOfIstDay)();
        await this.prisma.storeHealthSnapshot.upsert({
            where: { storeId_snapshotDate: { storeId, snapshotDate: today } },
            create: {
                storeId,
                healthScore: score,
                fulfillmentPct: fulfillmentScore,
                ratingsPct: ratingsScore,
                inventoryPct: inventoryScore,
                retentionPct: retentionScore,
                deliverySlaPct: deliverySlaScore,
                campaignPct: campaignScore,
                visibilityScore,
                snapshotDate: today,
            },
            update: {
                healthScore: score,
                fulfillmentPct: fulfillmentScore,
                ratingsPct: ratingsScore,
                inventoryPct: inventoryScore,
                retentionPct: retentionScore,
                deliverySlaPct: deliverySlaScore,
                campaignPct: campaignScore,
                visibilityScore,
            },
        });
        return {
            score,
            breakdown: {
                fulfillment: fulfillmentScore,
                ratings: ratingsScore,
                inventory: inventoryScore,
                retention: retentionScore,
                deliverySla: deliverySlaScore,
                campaign: campaignScore,
            },
            metrics: {
                fulfillmentRate: Math.round(fulfillmentRate * 1000) / 10,
                cancellationRate: Math.round(cancellationRate * 1000) / 10,
                averageRating: reputation.averageRating,
                ratingTrend,
                lowStockSkus: inv.lowStock,
                outOfStockSkus: inv.outOfStock,
                repeatCustomerPct: Math.round(retentionRate * 1000) / 10,
                avgDeliveryMins: Math.round(avgDeliveryMins),
                deliverySlaPct: Math.round(deliverySlaPct),
                visibilityScore,
                campaignActivityPct,
            },
        };
    }
};
exports.StoreHealthService = StoreHealthService;
exports.StoreHealthService = StoreHealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        store_reputation_service_1.StoreReputationService,
        merchant_dashboard_service_1.MerchantDashboardService,
        search_analytics_service_1.SearchAnalyticsService,
        merchant_crm_service_1.MerchantCrmService])
], StoreHealthService);
//# sourceMappingURL=store-health.service.js.map