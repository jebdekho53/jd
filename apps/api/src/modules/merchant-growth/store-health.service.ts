import { Injectable } from '@nestjs/common';
import { CampaignStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { startOfIstDay } from '../../common/utils/ist-day.util';
import { StoreReputationService } from '../store-review/store-reputation.service';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';
import { SearchAnalyticsService } from '../search-discovery/search-analytics.service';
import { MerchantCrmService } from '../crm/merchant-crm.service';

export interface HealthBreakdown {
  fulfillment: number;
  ratings: number;
  inventory: number;
  retention: number;
  deliverySla: number;
  campaign: number;
}

export interface StoreHealthResult {
  score: number;
  breakdown: HealthBreakdown;
  metrics: {
    fulfillmentRate: number;
    cancellationRate: number;
    averageRating: number;
    ratingTrend: 'up' | 'down' | 'stable';
    lowStockSkus: number;
    outOfStockSkus: number;
    repeatCustomerPct: number;
    avgDeliveryMins: number;
    deliverySlaPct: number;
    visibilityScore: number;
    campaignActivityPct: number;
  };
}

@Injectable()
export class StoreHealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reputation: StoreReputationService,
    private readonly dashboard: MerchantDashboardService,
    private readonly searchAnalytics: SearchAnalyticsService,
    private readonly merchantCrm: MerchantCrmService,
  ) {}

  async computeForStore(storeId: string, userId: string): Promise<StoreHealthResult> {
    const since90 = new Date(Date.now() - 90 * 86400000);
    const since30 = new Date(Date.now() - 30 * 86400000);

  const [reputation, inventory, , search, crm, deliveries, campaigns, orders] =
      await Promise.all([
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
          where: { storeId, status: { in: [CampaignStatus.ACTIVE, CampaignStatus.PAUSED, CampaignStatus.ENDED] } },
          select: { impressionCount: true, clickCount: true, orderCount: true },
        }),
        this.prisma.order.findMany({
          where: { storeId, createdAt: { gte: since90 } },
          select: { status: true },
        }),
      ]);

    const totalOrders = orders.length;
    const fulfilled = orders.filter(
      (o) => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.COMPLETED,
    ).length;
    const cancelled = orders.filter((o) => String(o.status).startsWith('CANCELLED')).length;
    const fulfillmentRate = totalOrders > 0 ? fulfilled / totalOrders : 1;
    const cancellationRate = totalOrders > 0 ? cancelled / totalOrders : 0;

    const fulfillmentScore = Math.round(fulfillmentRate * 30);
    const ratingsScore = Math.round((reputation.averageRating / 5) * 20);

    const inv = inventory.summary;
    const stockHealth =
      inv.totalProducts > 0
        ? 1 - (inv.lowStock + inv.outOfStock) / Math.max(inv.totalProducts, 1)
        : 0.5;
    const inventoryScore = Math.round(Math.max(0, Math.min(1, stockHealth)) * 15);

    const repeatCount = crm.repeatCustomers.length;
    const topCount = crm.topSpenders.length;
    const retentionRate = topCount > 0 ? Math.min(1, repeatCount / topCount) : 0;
    const retentionScore = Math.round(retentionRate * 15);

    const slaTargetMins = 45;
    const onTime = deliveries.filter((d) => {
      if (!d.deliveredAt || !d.assignedAt) return true;
      const mins = (d.deliveredAt.getTime() - d.assignedAt.getTime()) / 60000;
      return mins <= slaTargetMins;
    }).length;
    const deliverySlaPct = deliveries.length > 0 ? (onTime / deliveries.length) * 100 : 100;
    const deliverySlaScore = Math.round((deliverySlaPct / 100) * 10);

    const campaignImpressions = campaigns.reduce((s, c) => s + c.impressionCount, 0);
    const campaignOrders = campaigns.reduce((s, c) => s + c.orderCount, 0);
    const campaignActivityPct =
      campaigns.length > 0
        ? Math.min(100, campaigns.length * 20 + (campaignImpressions > 0 ? 30 : 0) + (campaignOrders > 0 ? 20 : 0))
        : 0;
    const campaignScore = Math.round((campaignActivityPct / 100) * 10);

    const visibilityScore = Math.min(
      100,
      Math.round(
        (search.impressions > 0 ? search.ctr * 2 : 0) +
          (search.conversionRate * 3) +
          Math.min(40, search.impressions / 10),
      ),
    );

    const score = Math.min(
      100,
      fulfillmentScore +
        ratingsScore +
        inventoryScore +
        retentionScore +
        deliverySlaScore +
        campaignScore,
    );

    const priorSnapshot = await this.prisma.storeHealthSnapshot.findFirst({
      where: { storeId },
      orderBy: { snapshotDate: 'desc' },
      skip: 1,
    });
    let ratingTrend: 'up' | 'down' | 'stable' = 'stable';
    if (priorSnapshot) {
      if (reputation.averageRating > (priorSnapshot.ratingsPct / 20) * 5 + 0.1) ratingTrend = 'up';
      else if (reputation.averageRating < (priorSnapshot.ratingsPct / 20) * 5 - 0.1) ratingTrend = 'down';
    }

    const avgDeliveryMins =
      deliveries.length > 0
        ? deliveries.reduce((s, d) => s + (d.estimatedMins ?? 30), 0) / deliveries.length
        : 30;

    const today = startOfIstDay();
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
}
