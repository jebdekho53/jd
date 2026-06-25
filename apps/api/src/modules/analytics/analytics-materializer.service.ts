import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AnalyticsSnapshotScope } from '@prisma/client';
import { AnalyticsAggregatorService } from './analytics-aggregator.service';
import { AnalyticsSnapshotService } from './analytics-snapshot.service';
import { AnalyticsAlertService } from './analytics-alert.service';
import { AnalyticsMetricsCacheService } from './analytics-metrics-cache.service';
import { PrismaService } from '../../database/prisma.service';
import { startOfUtcDay } from '../merchant-dashboard/merchant-dashboard.utils';

@Injectable()
export class AnalyticsMaterializerService {
  private readonly logger = new Logger(AnalyticsMaterializerService.name);

  constructor(
    private readonly aggregator: AnalyticsAggregatorService,
    private readonly snapshots: AnalyticsSnapshotService,
    private readonly alerts: AnalyticsAlertService,
    private readonly cache: AnalyticsMetricsCacheService,
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async materializeHourly() {
    const now = new Date();
    const bucket = new Date(now);
    bucket.setUTCMinutes(0, 0, 0);

    try {
      const metrics = await this.aggregator.aggregateHourly(bucket);
      await this.snapshots.upsertHourly(AnalyticsSnapshotScope.PLATFORM, null, bucket, metrics);

      const today = startOfUtcDay();
      const platformDaily = await this.aggregator.aggregatePlatformDaily(today);
      await this.snapshots.upsertDaily(AnalyticsSnapshotScope.PLATFORM, null, today, platformDaily);

      await this.cache.set(this.cache.key(['executive', 'latest']), platformDaily.executive, 900);
      this.events.emit('analytics.materialized', { type: 'hourly', at: now.toISOString() });
      this.logger.log(`Hourly analytics materialized for ${bucket.toISOString()}`);
    } catch (err) {
      this.logger.error('Hourly materialization failed', err instanceof Error ? err.stack : String(err));
    }
  }

  @Cron('30 1 * * *')
  async materializeDaily() {
    const yesterday = startOfUtcDay();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    try {
      const prev = new Date(yesterday);
      prev.setUTCDate(prev.getUTCDate() - 1);
      const platformDaily = await this.aggregator.aggregatePlatformDaily(yesterday, prev);
      await this.snapshots.upsertDaily(AnalyticsSnapshotScope.PLATFORM, null, yesterday, platformDaily);

      const stores = await this.prisma.store.findMany({
        where: { deletedAt: null, status: 'APPROVED' },
        select: { id: true },
        take: 500,
      });

      for (const store of stores) {
        const storeMetrics = await this.aggregator.aggregateStoreDaily(store.id, yesterday);
        await this.snapshots.upsertDaily(AnalyticsSnapshotScope.STORE, store.id, yesterday, storeMetrics);
      }

      await this.alerts.evaluateAfterDailySnapshot(platformDaily, yesterday);
      await this.cache.set(this.cache.key(['executive', 'latest']), platformDaily.executive, 86_400);
      this.events.emit('analytics.materialized', { type: 'daily', date: yesterday.toISOString().slice(0, 10) });
      this.logger.log(`Daily analytics materialized for ${yesterday.toISOString().slice(0, 10)}`);
    } catch (err) {
      this.logger.error('Daily materialization failed', err instanceof Error ? err.stack : String(err));
    }
  }

  async materializeNow() {
    await this.materializeHourly();
  }
}
