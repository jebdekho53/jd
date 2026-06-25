import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  AnalyticsAlertSeverity,
  AnalyticsAlertStatus,
  MerchantGrowthAlertType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { StoreHealthService } from './store-health.service';
import { SearchAnalyticsService } from '../search-discovery/search-analytics.service';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';

@Injectable()
export class GrowthAlertService {
  private readonly logger = new Logger(GrowthAlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly health: StoreHealthService,
    private readonly search: SearchAnalyticsService,
    private readonly dashboard: MerchantDashboardService,
  ) {}

  async listForStore(storeId: string, limit = 20) {
    return this.prisma.merchantGrowthAlert.findMany({
      where: { storeId, status: { in: [AnalyticsAlertStatus.OPEN, AnalyticsAlertStatus.ACKNOWLEDGED] } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async evaluateAllStores() {
    const stores = await this.prisma.store.findMany({
      where: { status: 'APPROVED', isActive: true, deletedAt: null },
      select: { id: true, merchantProfile: { select: { userId: true } } },
      take: 200,
    });

    for (const store of stores) {
      const userId = store.merchantProfile.userId;
      try {
        await this.evaluateStore(store.id, userId);
      } catch (err) {
        this.logger.warn(`Growth alert eval failed for ${store.id}: ${(err as Error).message}`);
      }
    }
  }

  async evaluateStore(storeId: string, userId: string) {
    const result = await this.health.computeForStore(storeId, userId);
    const search = await this.search.getMerchantInsights(storeId, '7d');
    const analytics = await this.dashboard.getAnalytics(userId, { storeId, period: '7d' });

    const prior = await this.prisma.storeHealthSnapshot.findFirst({
      where: { storeId },
      orderBy: { snapshotDate: 'desc' },
      skip: 1,
    });

    if (prior && prior.healthScore - result.score >= 10) {
      await this.raise(
        storeId,
        MerchantGrowthAlertType.STORE_HEALTH_DROP,
        AnalyticsAlertSeverity.WARNING,
        'Store health score dropped',
        `Health fell from ${prior.healthScore} to ${result.score}.`,
        { prior: prior.healthScore, current: result.score },
      );
    }

    if (result.metrics.visibilityScore < 25) {
      await this.raise(
        storeId,
        MerchantGrowthAlertType.VISIBILITY_DROP,
        AnalyticsAlertSeverity.WARNING,
        'Search visibility is low',
        `Visibility score ${result.metrics.visibilityScore}/100 — improve listings and stock.`,
        { visibilityScore: result.metrics.visibilityScore },
      );
    }

    if (result.metrics.repeatCustomerPct < 15) {
      await this.raise(
        storeId,
        MerchantGrowthAlertType.LOW_REPEAT_CUSTOMERS,
        AnalyticsAlertSeverity.WARNING,
        'Low repeat customer rate',
        `Only ${result.metrics.repeatCustomerPct}% repeat buyers — consider loyalty campaigns.`,
      );
    }

    if (analytics.cancellationRate > 12) {
      await this.raise(
        storeId,
        MerchantGrowthAlertType.HIGH_CANCELLATION,
        AnalyticsAlertSeverity.CRITICAL,
        'High cancellation rate',
        `Cancellation rate ${analytics.cancellationRate}% exceeds threshold.`,
        { cancellationRate: analytics.cancellationRate },
      );
    }

    if (search.lostSearches.length >= 5) {
      await this.raise(
        storeId,
        MerchantGrowthAlertType.LOST_SEARCH_TRAFFIC,
        AnalyticsAlertSeverity.WARNING,
        'Lost search traffic',
        `${search.lostSearches.length} high-intent searches with no matching products.`,
        { top: search.lostSearches.slice(0, 5) },
      );
    }
  }

  private async raise(
    storeId: string,
    alertType: MerchantGrowthAlertType,
    severity: AnalyticsAlertSeverity,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
  ) {
    const recent = await this.prisma.merchantGrowthAlert.findFirst({
      where: {
        storeId,
        alertType,
        status: AnalyticsAlertStatus.OPEN,
        createdAt: { gte: new Date(Date.now() - 6 * 3600000) },
      },
    });
    if (recent) return;

    await this.prisma.merchantGrowthAlert.create({
      data: {
        storeId,
        alertType,
        severity,
        title,
        message,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
