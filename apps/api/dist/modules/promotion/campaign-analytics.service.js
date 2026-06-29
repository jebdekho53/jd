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
exports.CampaignAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let CampaignAnalyticsService = class CampaignAnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async trackEvent(input) {
        await this.prisma.$transaction([
            this.prisma.campaignEvent.create({
                data: {
                    campaignId: input.campaignId,
                    offerId: input.offerId,
                    eventType: input.eventType,
                    buyerProfileId: input.buyerProfileId,
                    storeId: input.storeId,
                    metadata: input.metadata,
                },
            }),
            this.prisma.campaign.update({
                where: { id: input.campaignId },
                data: {
                    ...(input.eventType === 'IMPRESSION' && { impressionCount: { increment: 1 } }),
                    ...(input.eventType === 'CLICK' && { clickCount: { increment: 1 } }),
                },
            }),
        ]);
    }
    async getLeaderboard(limit = 10) {
        const campaigns = await this.prisma.campaign.findMany({
            where: { status: { in: ['ACTIVE', 'ENDED'] } },
            include: { store: { select: { id: true, name: true, slug: true } } },
            orderBy: { gmvGenerated: 'desc' },
            take: limit,
        });
        return campaigns.map((c, idx) => ({
            rank: idx + 1,
            campaignId: c.id,
            name: c.name,
            scope: c.scope,
            store: c.store,
            gmvGenerated: Number(c.gmvGenerated),
            orderCount: c.orderCount,
            impressions: c.impressionCount,
            clicks: c.clickCount,
            conversion: c.impressionCount > 0
                ? Math.round((c.orderCount / c.impressionCount) * 10000) / 100
                : 0,
        }));
    }
    async getFraudSignals() {
        const [couponAbuse, offerAbuse, refundImpact] = await Promise.all([
            this.prisma.couponUsage.groupBy({
                by: ['buyerProfileId', 'couponId'],
                _count: { id: true },
                having: { id: { _count: { gt: 5 } } },
                orderBy: { _count: { id: 'desc' } },
                take: 20,
            }),
            this.prisma.offerUsage.groupBy({
                by: ['buyerProfileId', 'offerId'],
                _count: { id: true },
                having: { id: { _count: { gt: 3 } } },
                orderBy: { _count: { id: 'desc' } },
                take: 20,
            }),
            this.prisma.offerUsage.aggregate({
                _sum: { discountApplied: true, cashbackApplied: true },
                _count: { id: true },
            }),
        ]);
        return {
            couponAbuseCandidates: couponAbuse.length,
            offerAbuseCandidates: offerAbuse.length,
            refundImpactAmount: Number(refundImpact._sum.discountApplied ?? 0) +
                Number(refundImpact._sum.cashbackApplied ?? 0),
            refundAffectedRedemptions: refundImpact._count.id,
            topOfferAbusers: offerAbuse.slice(0, 5),
        };
    }
    async getPlatformSummary() {
        const [campaigns, usages, events] = await Promise.all([
            this.prisma.campaign.aggregate({
                _count: { id: true },
                _sum: { gmvGenerated: true, spentAmount: true, impressionCount: true, clickCount: true },
            }),
            this.prisma.offerUsage.aggregate({
                _count: { id: true },
                _sum: { discountApplied: true, cashbackApplied: true, gmvImpact: true },
            }),
            this.prisma.campaignEvent.groupBy({
                by: ['eventType'],
                _count: { id: true },
            }),
        ]);
        const eventMap = Object.fromEntries(events.map((e) => [e.eventType, e._count.id]));
        return {
            totalCampaigns: campaigns._count.id,
            totalGmv: Number(campaigns._sum.gmvGenerated ?? 0),
            totalSpent: Number(campaigns._sum.spentAmount ?? 0),
            impressions: campaigns._sum.impressionCount ?? 0,
            clicks: campaigns._sum.clickCount ?? 0,
            redemptions: usages._count.id,
            discountGiven: Number(usages._sum.discountApplied ?? 0) + Number(usages._sum.cashbackApplied ?? 0),
            incrementalRevenue: Number(usages._sum.gmvImpact ?? 0),
            events: eventMap,
        };
    }
};
exports.CampaignAnalyticsService = CampaignAnalyticsService;
exports.CampaignAnalyticsService = CampaignAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CampaignAnalyticsService);
//# sourceMappingURL=campaign-analytics.service.js.map