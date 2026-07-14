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

  /** Impression reach + spend split by placement (SEARCH / HOME / CATEGORY). */
  async getPlacementBreakdown() {
    const grouped = await this.prisma.adImpression.groupBy({
      by: ['placement'],
      _count: { _all: true },
      _sum: { cost: true },
    });
    return grouped
      .map((g) => ({
        placement: g.placement,
        impressions: g._count._all,
        spend: Number(g._sum.cost ?? 0),
      }))
      .sort((a, b) => b.impressions - a.impressions);
  }

  /** Daily impressions / clicks / CTR for the last `days` days (oldest → newest). */
  async getDailyTimeSeries(days = 14) {
    const span = Math.max(1, Math.min(90, days));
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (span - 1));

    const [impressions, clicks] = await Promise.all([
      this.prisma.adImpression.findMany({
        where: { createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      this.prisma.adClick.findMany({
        where: { createdAt: { gte: start } },
        select: { createdAt: true },
      }),
    ]);

    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const buckets = new Map<string, { impressions: number; clicks: number }>();
    for (let i = 0; i < span; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      buckets.set(dayKey(d), { impressions: 0, clicks: 0 });
    }
    for (const im of impressions) {
      const b = buckets.get(dayKey(im.createdAt));
      if (b) b.impressions += 1;
    }
    for (const c of clicks) {
      const b = buckets.get(dayKey(c.createdAt));
      if (b) b.clicks += 1;
    }

    return Array.from(buckets.entries()).map(([date, v]) => ({
      date,
      impressions: v.impressions,
      clicks: v.clicks,
      ctr: v.impressions > 0 ? Math.round((v.clicks / v.impressions) * 10000) / 100 : 0,
    }));
  }

  /** Per-campaign performance table for the admin, richest campaigns first. */
  async getCampaignBreakdown(limit = 25) {
    const campaigns = await this.prisma.adCampaign.findMany({
      orderBy: { spentAmount: 'desc' },
      take: limit,
      include: { advertiser: { select: { businessName: true } } },
    });
    const rows = await Promise.all(
      campaigns.map(async (c) => {
        const metrics = await this.getCampaignMetrics(c.id);
        return {
          id: c.id,
          name: c.name,
          advertiser: c.advertiser?.businessName ?? '—',
          status: c.status,
          ...metrics,
        };
      }),
    );
    return rows;
  }
}
