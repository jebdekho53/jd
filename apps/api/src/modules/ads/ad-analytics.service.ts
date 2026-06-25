import { Injectable } from '@nestjs/common';
import { AdCampaignStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { computeCtr, computeRoas } from './ad-auction.util';

@Injectable()
export class AdAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCampaignMetrics(campaignId: string) {
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
      roas: computeRoas(revenue, spend),
    };
  }

  async getMerchantAnalytics(advertiserId: string) {
    const campaigns = await this.prisma.adCampaign.findMany({ where: { advertiserId } });
    const metrics = await Promise.all(campaigns.map((c) => this.getCampaignMetrics(c.id)));
    const totals = metrics.reduce(
      (acc, m) => ({
        impressions: acc.impressions + m.impressions,
        clicks: acc.clicks + m.clicks,
        conversions: acc.conversions + m.conversions,
        revenue: acc.revenue + m.revenue,
        spend: acc.spend + m.spend,
      }),
      { impressions: 0, clicks: 0, conversions: 0, revenue: 0, spend: 0 },
    );
    return {
      ...totals,
      ctr: totals.impressions > 0 ? Math.round((totals.clicks / totals.impressions) * 10000) / 100 : 0,
      roas: computeRoas(totals.revenue, totals.spend),
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
      roas: computeRoas(platformRevenue, platformSpend),
      ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
      advertisers: advertisers.length,
      impressions,
      clicks,
    };
  }
}
