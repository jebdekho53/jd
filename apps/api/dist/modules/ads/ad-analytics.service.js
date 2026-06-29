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
exports.AdAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const ad_auction_util_1 = require("./ad-auction.util");
let AdAnalyticsService = class AdAnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCampaignMetrics(campaignId) {
        const [impressions, clicks, conversions, campaign] = await Promise.all([
            this.prisma.adImpression.count({ where: { campaignId } }),
            this.prisma.adClick.count({ where: { campaignId } }),
            this.prisma.adConversion.findMany({ where: { campaignId } }),
            this.prisma.adCampaign.findUnique({ where: { id: campaignId } }),
        ]);
        const revenue = conversions.reduce((s, c) => s + Number(c.revenue), 0);
        const spend = Number(campaign?.spentAmount ?? 0);
        const ctr = impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;
        return {
            impressions,
            clicks,
            ctr,
            conversions: conversions.length,
            revenue,
            spend,
            roas: (0, ad_auction_util_1.computeRoas)(revenue, spend),
        };
    }
    async getMerchantAnalytics(advertiserId) {
        const campaigns = await this.prisma.adCampaign.findMany({ where: { advertiserId } });
        const metrics = await Promise.all(campaigns.map((c) => this.getCampaignMetrics(c.id)));
        const totals = metrics.reduce((acc, m) => ({
            impressions: acc.impressions + m.impressions,
            clicks: acc.clicks + m.clicks,
            conversions: acc.conversions + m.conversions,
            revenue: acc.revenue + m.revenue,
            spend: acc.spend + m.spend,
        }), { impressions: 0, clicks: 0, conversions: 0, revenue: 0, spend: 0 });
        return {
            ...totals,
            ctr: totals.impressions > 0 ? Math.round((totals.clicks / totals.impressions) * 10000) / 100 : 0,
            roas: (0, ad_auction_util_1.computeRoas)(totals.revenue, totals.spend),
            campaigns: campaigns.length,
        };
    }
    async getAdminAnalytics() {
        const [revenue, spend, advertisers, impressions, clicks] = await Promise.all([
            this.prisma.adConversion.aggregate({ _sum: { revenue: true } }),
            this.prisma.adCampaign.aggregate({ _sum: { spentAmount: true } }),
            this.prisma.adCampaign.groupBy({ by: ['advertiserId'], _count: { id: true } }),
            this.prisma.adImpression.count(),
            this.prisma.adClick.count(),
        ]);
        const platformRevenue = Number(revenue._sum.revenue ?? 0);
        const platformSpend = Number(spend._sum.spentAmount ?? 0);
        return {
            revenue: platformRevenue,
            adSpend: platformSpend,
            roas: (0, ad_auction_util_1.computeRoas)(platformRevenue, platformSpend),
            ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
            advertisers: advertisers.length,
            impressions,
            clicks,
        };
    }
};
exports.AdAnalyticsService = AdAnalyticsService;
exports.AdAnalyticsService = AdAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdAnalyticsService);
//# sourceMappingURL=ad-analytics.service.js.map