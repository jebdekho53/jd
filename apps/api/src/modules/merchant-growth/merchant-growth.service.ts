import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';
import { SearchAnalyticsService } from '../search-discovery/search-analytics.service';
import { MerchantCrmService } from '../crm/merchant-crm.service';
import { StoreHealthService } from './store-health.service';
import { GrowthRecommendationsService } from './growth-recommendations.service';
import { GrowthAlertService } from './growth-alert.service';

@Injectable()
export class MerchantGrowthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboard: MerchantDashboardService,
    private readonly health: StoreHealthService,
    private readonly recommendations: GrowthRecommendationsService,
    private readonly search: SearchAnalyticsService,
    private readonly crm: MerchantCrmService,
    private readonly alerts: GrowthAlertService,
  ) {}

  private async resolveStore(userId: string, storeId?: string) {
    const ctx = await this.dashboard.resolveStoreContext(userId, storeId);
    const storeIdResolved = storeId ?? ctx.storeIds[0];
    if (!storeIdResolved) return null;
    return storeIdResolved;
  }

  async getOverview(userId: string, storeId?: string) {
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

  async getRecommendations(userId: string, storeId?: string) {
    const sid = await this.resolveStore(userId, storeId);
    if (!sid) return { recommendations: [] };
    const health = await this.health.computeForStore(sid, userId);
    const search = await this.search.getMerchantInsights(sid, '30d');
    const recommendations = await this.recommendations.buildRecommendations(sid, health, search);
    return { recommendations };
  }

  async getVisibility(userId: string, storeId?: string) {
    const sid = await this.resolveStore(userId, storeId);
    if (!sid) return { visibilityScore: 0, insights: null };
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

  async getOpportunities(userId: string, storeId?: string) {
    const sid = await this.resolveStore(userId, storeId);
    if (!sid) return { revenue: [], expansion: [], retention: [] };

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

  async getBenchmark(userId: string, storeId?: string) {
    const sid = await this.resolveStore(userId, storeId);
    if (!sid) return { store: null, platform: null };

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

  private async estimateHiddenLocalities(storeId: string): Promise<string[]> {
    const zones = await this.prisma.storeZone.findMany({
      where: { storeId },
      include: { zone: { select: { name: true } } },
    });
    if (zones.length === 0) return [];

    const lowImpressionZones: string[] = [];
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
}
