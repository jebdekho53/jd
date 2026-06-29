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
exports.CrmAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let CrmAnalyticsService = class CrmAnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboard() {
        const since = new Date(Date.now() - 30 * 86400000);
        const [segments, journeys, events, pushCampaigns, emailCampaigns, deliveries, feedback,] = await Promise.all([
            this.prisma.customerSegment.aggregate({ _sum: { memberCount: true }, _count: true }),
            this.prisma.customerJourney.groupBy({
                by: ['status'],
                _count: true,
            }),
            this.prisma.marketingEvent.count({ where: { createdAt: { gte: since } } }),
            this.prisma.pushCampaign.findMany({ where: { status: { in: ['RUNNING', 'COMPLETED'] } } }),
            this.prisma.emailCampaign.findMany({ where: { status: { in: ['RUNNING', 'COMPLETED'] } } }),
            this.prisma.notificationDelivery.findMany({
                where: { createdAt: { gte: since } },
                select: { status: true, channel: true },
            }),
            this.prisma.supportFeedback.findMany({
                where: { createdAt: { gte: since } },
                select: { rating: true },
            }),
        ]);
        const allCampaigns = [...pushCampaigns, ...emailCampaigns];
        const totalSent = allCampaigns.reduce((s, c) => s + c.sentCount, 0);
        const totalOpens = allCampaigns.reduce((s, c) => s + c.openCount, 0);
        const totalClicks = allCampaigns.reduce((s, c) => s + c.clickCount, 0);
        const totalConversions = allCampaigns.reduce((s, c) => s + c.conversionCount, 0);
        const totalRevenue = allCampaigns.reduce((s, c) => s + Number(c.revenue), 0);
        const openRate = totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0;
        const ctr = totalOpens > 0 ? Math.round((totalClicks / totalOpens) * 100) : 0;
        const conversionRate = totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 100) : 0;
        const repeatBuyers = await this.prisma.order.groupBy({
            by: ['buyerProfileId'],
            where: { createdAt: { gte: since } },
            _count: true,
            having: { buyerProfileId: { _count: { gte: 2 } } },
        });
        const totalBuyers = await this.prisma.order.groupBy({
            by: ['buyerProfileId'],
            where: { createdAt: { gte: since } },
        });
        const retentionPct = totalBuyers.length > 0 ? Math.round((repeatBuyers.length / totalBuyers.length) * 100) : 0;
        return {
            segments: {
                count: segments._count,
                totalMembers: segments._sum.memberCount ?? 0,
            },
            journeys: journeys.reduce((acc, j) => ({ ...acc, [j.status]: j._count }), {}),
            eventsCaptured: events,
            openRate,
            ctr,
            conversionRate,
            revenue: totalRevenue,
            retentionPct,
            repeatPurchaseRate: retentionPct,
            campaignRoi: totalSent > 0 ? Math.round((totalRevenue / totalSent) * 100) / 100 : 0,
            deliveriesByChannel: deliveries.reduce((acc, d) => {
                acc[d.channel] = (acc[d.channel] ?? 0) + 1;
                return acc;
            }, {}),
            csat: feedback.length > 0
                ? Math.round((feedback.reduce((s, f) => s + f.rating, 0) / feedback.length) * 20)
                : null,
            ltvEstimate: totalRevenue > 0 && totalBuyers.length > 0 ? Math.round(totalRevenue / totalBuyers.length) : 0,
        };
    }
    async listCampaigns() {
        const [push, email, sms, whatsapp] = await Promise.all([
            this.prisma.pushCampaign.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
            this.prisma.emailCampaign.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
            this.prisma.smsCampaign.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
            this.prisma.whatsappCampaign.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
        ]);
        return { push, email, sms, whatsapp };
    }
    async selectAbWinner(campaignType, campaignId) {
        const campaign = campaignType === 'push'
            ? await this.prisma.pushCampaign.findUnique({ where: { id: campaignId } })
            : await this.prisma.emailCampaign.findUnique({ where: { id: campaignId } });
        if (!campaign?.variantB)
            return client_1.AbVariantKey.A;
        const variantA = campaign.variantA;
        const variantB = campaign.variantB;
        const winner = (variantB.conversionRate ?? 0) > (variantA.conversionRate ?? 0)
            ? client_1.AbVariantKey.B
            : client_1.AbVariantKey.A;
        if (campaignType === 'push') {
            await this.prisma.pushCampaign.update({
                where: { id: campaignId },
                data: { winnerVariant: winner },
            });
        }
        else {
            await this.prisma.emailCampaign.update({
                where: { id: campaignId },
                data: { winnerVariant: winner },
            });
        }
        return winner;
    }
};
exports.CrmAnalyticsService = CrmAnalyticsService;
exports.CrmAnalyticsService = CrmAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CrmAnalyticsService);
//# sourceMappingURL=crm-analytics.service.js.map