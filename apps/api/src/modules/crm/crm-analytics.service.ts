import { Injectable } from '@nestjs/common';
import { AbVariantKey } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CrmAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const since = new Date(Date.now() - 30 * 86400000);

    const [
      segments,
      journeys,
      events,
      pushCampaigns,
      emailCampaigns,
      deliveries,
      feedback,
    ] = await Promise.all([
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

    const retentionPct =
      totalBuyers.length > 0 ? Math.round((repeatBuyers.length / totalBuyers.length) * 100) : 0;

    return {
      segments: {
        count: segments._count,
        totalMembers: segments._sum.memberCount ?? 0,
      },
      journeys: journeys.reduce(
        (acc, j) => ({ ...acc, [j.status]: j._count }),
        {} as Record<string, number>,
      ),
      eventsCaptured: events,
      openRate,
      ctr,
      conversionRate,
      revenue: totalRevenue,
      retentionPct,
      repeatPurchaseRate: retentionPct,
      campaignRoi: totalSent > 0 ? Math.round((totalRevenue / totalSent) * 100) / 100 : 0,
      deliveriesByChannel: deliveries.reduce(
        (acc, d) => {
          acc[d.channel] = (acc[d.channel] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      csat:
        feedback.length > 0
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

  async selectAbWinner(
    campaignType: 'push' | 'email',
    campaignId: string,
  ): Promise<AbVariantKey> {
    const campaign =
      campaignType === 'push'
        ? await this.prisma.pushCampaign.findUnique({ where: { id: campaignId } })
        : await this.prisma.emailCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign?.variantB) return AbVariantKey.A;

    const variantA = campaign.variantA as { conversionRate?: number };
    const variantB = campaign.variantB as { conversionRate?: number };
    const winner =
      (variantB.conversionRate ?? 0) > (variantA.conversionRate ?? 0)
        ? AbVariantKey.B
        : AbVariantKey.A;

    if (campaignType === 'push') {
      await this.prisma.pushCampaign.update({
        where: { id: campaignId },
        data: { winnerVariant: winner },
      });
    } else {
      await this.prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { winnerVariant: winner },
      });
    }

    return winner;
  }
}
