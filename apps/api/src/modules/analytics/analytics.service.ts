import { Injectable } from '@nestjs/common';
import { AnalyticsSnapshotScope } from '@prisma/client';
import { AnalyticsSnapshotService } from './analytics-snapshot.service';
import { AnalyticsMetricsCacheService } from './analytics-metrics-cache.service';
import { AnalyticsAggregatorService } from './analytics-aggregator.service';
import { AnalyticsAlertService } from './analytics-alert.service';
import { AnalyticsExportService, type ExportFormat, type ExportRange } from './analytics-export.service';
import { DeliveryTrackingService } from '../delivery-tracking/delivery-tracking.service';
import { PrismaService } from '../../database/prisma.service';
import { daysAgo, startOfIstDay, startOfIstMonth, startOfIstWeek } from '../../common/utils/ist-day.util';
import type {
  HourlyMetrics,
  PlatformDailyMetrics,
  SalesPoint,
} from './analytics-metrics.types';
import { REVENUE_STATUSES } from '../merchant-dashboard/merchant-dashboard.utils';
import { OrderStatus } from '@prisma/client';

function parseRange(range: ExportRange, from?: string, to?: string): { from: Date; to: Date } {
  const today = startOfIstDay();
  switch (range) {
    case 'today':
      return { from: today, to: new Date() };
    case 'yesterday': {
      const y = daysAgo(1);
      const yEnd = new Date(today);
      return { from: y, to: yEnd };
    }
    case '7d':
      return { from: daysAgo(7), to: new Date() };
    case '30d':
      return { from: daysAgo(30), to: new Date() };
    case '90d':
      return { from: daysAgo(90), to: new Date() };
    case 'custom':
      return {
        from: from ? startOfIstDay(new Date(from)) : daysAgo(7),
        to: to ? new Date(to) : new Date(),
      };
    default:
      return { from: daysAgo(7), to: new Date() };
  }
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly snapshots: AnalyticsSnapshotService,
    private readonly cache: AnalyticsMetricsCacheService,
    private readonly aggregator: AnalyticsAggregatorService,
    private readonly alerts: AnalyticsAlertService,
    private readonly exportSvc: AnalyticsExportService,
    private readonly tracking: DeliveryTrackingService,
    private readonly prisma: PrismaService,
  ) {}

  private async getPlatformMetricsForDate(date: Date): Promise<PlatformDailyMetrics | null> {
    const snap = await this.snapshots.getDaily(AnalyticsSnapshotScope.PLATFORM, null, date);
    if (snap) return snap.metrics as unknown as PlatformDailyMetrics;
    return null;
  }

  private async ensureTodaySnapshot(): Promise<PlatformDailyMetrics> {
    const today = startOfIstDay();
    const cached = await this.cache.get<PlatformDailyMetrics['executive']>(
      this.cache.key(['executive', 'latest']),
    );
    const existing = await this.getPlatformMetricsForDate(today);
    if (existing) return existing;

    const metrics = await this.aggregator.aggregatePlatformDaily(today);
    await this.snapshots.upsertDaily(AnalyticsSnapshotScope.PLATFORM, null, today, metrics);
    if (!cached) await this.cache.set(this.cache.key(['executive', 'latest']), metrics.executive, 300);
    return metrics;
  }

  async getExecutive() {
    const today = startOfIstDay();
    const metrics = await this.ensureTodaySnapshot();
    const yesterdayMetrics = await this.getPlatformMetricsForDate(daysAgo(1));
    return {
      asOf: today.toISOString().slice(0, 10),
      source: 'snapshot',
      ...metrics.executive,
      priorDay: yesterdayMetrics?.executive ?? null,
    };
  }

  async getSales(granularity: string, compare?: string) {
    const { from, to } = parseRange('30d');
    const hourly = await this.snapshots.listHourly(AnalyticsSnapshotScope.PLATFORM, null, from, to);
    const daily = await this.snapshots.listDaily(AnalyticsSnapshotScope.PLATFORM, null, from, to);

    const series = this.buildSalesSeries(granularity, hourly, daily);
    const comparisons = await this.buildComparisons(compare, granularity, hourly, daily);

    return { granularity, series, comparisons, source: 'snapshot' };
  }

  private buildSalesSeries(
    granularity: string,
    hourly: { bucketAt: Date; metrics: unknown }[],
    daily: { snapshotDate: Date; metrics: unknown }[],
  ): SalesPoint[] {
    if (granularity === 'hourly') {
      return hourly.map((h) => {
        const m = h.metrics as HourlyMetrics;
        return {
          label: h.bucketAt.toISOString(),
          orders: m.orders,
          gmv: m.gmv,
          revenue: m.revenue,
        };
      });
    }

    if (granularity === 'weekly' || granularity === 'monthly' || granularity === 'yearly') {
      const buckets = new Map<string, SalesPoint>();
      for (const d of daily) {
        const m = (d.metrics as PlatformDailyMetrics).executive;
        const dt = new Date(d.snapshotDate);
        let key: string;
        if (granularity === 'weekly') {
          const wk = Math.floor((dt.getUTCDate() - 1) / 7);
          key = `${dt.getUTCFullYear()}-W${wk}`;
        } else if (granularity === 'monthly') {
          key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
        } else {
          key = String(dt.getUTCFullYear());
        }
        const cur = buckets.get(key) ?? { label: key, orders: 0, gmv: 0, revenue: 0 };
        cur.orders += m.orders;
        cur.gmv += m.gmv;
        cur.revenue += m.revenue;
        buckets.set(key, cur);
      }
      return [...buckets.values()];
    }

    return daily.map((d) => {
      const m = (d.metrics as PlatformDailyMetrics).executive;
      return {
        label: new Date(d.snapshotDate).toISOString().slice(0, 10),
        orders: m.orders,
        gmv: m.gmv,
        revenue: m.revenue,
      };
    });
  }

  private async buildComparisons(
    compare: string | undefined,
    granularity: string,
    hourly: { bucketAt: Date; metrics: unknown }[],
    daily: { snapshotDate: Date; metrics: unknown }[],
  ) {
    if (!compare) return null;
    const today = startOfIstDay();
    const yesterday = daysAgo(1);
    const thisWeekStart = startOfIstWeek();
    const lastWeekStart = startOfIstWeek(daysAgo(7));
    const thisMonthStart = startOfIstMonth();
    const lastMonthStart = startOfIstMonth(new Date(thisMonthStart.getTime() - 1));

    const sumRange = (start: Date, end: Date) => {
      const src = granularity === 'hourly' ? hourly : daily;
      let orders = 0;
      let gmv = 0;
      for (const row of src) {
        const at = granularity === 'hourly' ? (row as { bucketAt: Date }).bucketAt : (row as { snapshotDate: Date }).snapshotDate;
        if (at >= start && at < end) {
          const m =
            granularity === 'hourly'
              ? (row.metrics as HourlyMetrics)
              : (row.metrics as PlatformDailyMetrics).executive;
          orders += m.orders;
          gmv += 'gmv' in m ? m.gmv : (m as { gmv: number }).gmv;
        }
      }
      return { orders, gmv };
    };

    if (compare === 'today_yesterday') {
      const a = sumRange(today, new Date());
      const b = sumRange(yesterday, today);
      return { current: a, previous: b, label: 'Today vs Yesterday' };
    }
    if (compare === 'week') {
      return {
        current: sumRange(thisWeekStart, new Date()),
        previous: sumRange(lastWeekStart, thisWeekStart),
        label: 'This Week vs Last Week',
      };
    }
    if (compare === 'month') {
      const lastMonthEnd = new Date(thisMonthStart);
      return {
        current: sumRange(thisMonthStart, new Date()),
        previous: sumRange(lastMonthStart, lastMonthEnd),
        label: 'This Month vs Last Month',
      };
    }
    return null;
  }

  async getOrders() {
    const m = await this.ensureTodaySnapshot();
    return { source: 'snapshot', ...m.orders };
  }

  async getCustomers() {
    const m = await this.ensureTodaySnapshot();
    return { source: 'snapshot', ...m.customers };
  }

  async getMerchants() {
    const { from, to } = parseRange('7d');
    const storeSnaps = await this.prisma.analyticsDailySnapshot.findMany({
      where: { scope: AnalyticsSnapshotScope.STORE, snapshotDate: { gte: from, lte: to } },
      orderBy: { snapshotDate: 'desc' },
      take: 100,
    });
    const topStores = storeSnaps
      .map((s) => ({
        storeId: s.scopeId,
        date: s.snapshotDate,
        metrics: s.metrics,
      }))
      .slice(0, 20);
    return { source: 'snapshot', topStores };
  }

  async getRiders() {
    const m = await this.ensureTodaySnapshot();
    return { source: 'snapshot', ...m.riders };
  }

  async getGeo() {
    const m = await this.ensureTodaySnapshot();
    return { source: 'snapshot', ...m.geo };
  }

  async getInventory() {
    const m = await this.ensureTodaySnapshot();
    return { source: 'snapshot', ...m.inventory };
  }

  async getWalletRewards() {
    const m = await this.ensureTodaySnapshot();
    return { source: 'snapshot', ...m.walletRewards };
  }

  async getFunnel() {
    const m = await this.ensureTodaySnapshot();
    return { source: 'snapshot', ...m.funnel };
  }

  async getAlerts() {
    const data = await this.alerts.listOpen();
    return { source: 'snapshot', alerts: data };
  }

  async acknowledgeAlert(id: string) {
    return this.alerts.acknowledge(id);
  }

  async exportData(format: ExportFormat, range: ExportRange, type: string, from?: string, to?: string) {
    const { from: start, to: end } = parseRange(range, from, to);
    const daily = await this.snapshots.listDaily(AnalyticsSnapshotScope.PLATFORM, null, start, end);
    const metrics = daily.map((d) => d.metrics as unknown as PlatformDailyMetrics);

    if (type === 'sales') {
      const series = metrics.map((m, i) => ({
        label: `day-${i + 1}`,
        orders: m.executive.orders,
        gmv: m.executive.gmv,
        revenue: m.executive.revenue,
      }));
      return this.exportSvc.exportSales(series, format);
    }
    return this.exportSvc.exportExecutive(metrics, format);
  }

  async getControlRoom() {
    const todayStart = startOfIstDay();
    const [fleet, executive, alertList, trustAlerts, health] = await Promise.all([
      this.tracking.getFleetLive(),
      this.getExecutive(),
      this.alerts.listOpen(10),
      this.prisma.trustAlert.findMany({
        where: { status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.$queryRaw<[{ ok: number }]>`SELECT 1::int AS ok`,
    ]);

    const [todayRevenue, lastHourRevenue, preparing, fraudAlerts, trustAlertCount] = await Promise.all([
      this.prisma.order.aggregate({
        where: { createdAt: { gte: todayStart }, status: { in: REVENUE_STATUSES } },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: new Date(Date.now() - 3600_000) },
          status: { in: REVENUE_STATUSES },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.count({
        where: { status: { in: [OrderStatus.PREPARING, OrderStatus.PACKING] } },
      }),
      this.prisma.walletFraudReview.count({ where: { status: 'PENDING' } }),
      this.prisma.trustAlert.count({ where: { status: 'OPEN' } }),
    ]);

    return {
      orders: {
        active: fleet.stats.activeOrders,
        today: executive.orders,
        unassigned: fleet.stats.unassignedOrders,
      },
      riders: {
        online: fleet.stats.onlineRiders,
        busy: fleet.stats.busyRiders,
        offline: fleet.stats.offlineRiders,
      },
      deliveries: {
        inProgress: fleet.stats.activeOrders,
        completedToday: executive.orders,
      },
      revenue: {
        today: Number(todayRevenue._sum.totalAmount ?? 0),
        lastHour: Number(lastHourRevenue._sum.totalAmount ?? 0),
      },
      storeActivity: {
        activeStores: executive.activeMerchants,
        preparingOrders: preparing,
      },
      fraudAlerts: fraudAlerts + trustAlertCount,
      systemHealth: { api: 'ok', db: health[0]?.ok === 1 ? 'ok' : 'degraded' },
      alerts: [
        ...alertList.map((a) => ({ id: a.id, title: a.title, severity: a.severity })),
        ...trustAlerts.map((a) => ({ id: a.id, title: a.title, severity: a.severity })),
      ],
      updatedAt: new Date().toISOString(),
    };
  }

  async getMerchantSnapshot(storeId: string, period: '7d' | '30d' = '7d') {
    const days = period === '30d' ? 30 : 7;
    const from = daysAgo(days);
    const snaps = await this.snapshots.listDaily(AnalyticsSnapshotScope.STORE, storeId, from, new Date());
    if (snaps.length === 0) {
      const today = await this.aggregator.aggregateStoreDaily(storeId, startOfIstDay());
      return { source: 'live-fallback', period, rollup: today, series: [] };
    }
    return {
      source: 'snapshot',
      period,
      series: snaps.map((s) => ({ date: s.snapshotDate, metrics: s.metrics })),
      rollup: snaps[snaps.length - 1]?.metrics,
    };
  }
}
