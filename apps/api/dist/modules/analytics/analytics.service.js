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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const analytics_snapshot_service_1 = require("./analytics-snapshot.service");
const analytics_metrics_cache_service_1 = require("./analytics-metrics-cache.service");
const analytics_aggregator_service_1 = require("./analytics-aggregator.service");
const analytics_alert_service_1 = require("./analytics-alert.service");
const analytics_export_service_1 = require("./analytics-export.service");
const delivery_tracking_service_1 = require("../delivery-tracking/delivery-tracking.service");
const prisma_service_1 = require("../../database/prisma.service");
const ist_day_util_1 = require("../../common/utils/ist-day.util");
const merchant_dashboard_utils_1 = require("../merchant-dashboard/merchant-dashboard.utils");
const client_2 = require("@prisma/client");
function parseRange(range, from, to) {
    const today = (0, ist_day_util_1.startOfIstDay)();
    switch (range) {
        case 'today':
            return { from: today, to: new Date() };
        case 'yesterday': {
            const y = (0, ist_day_util_1.daysAgo)(1);
            const yEnd = new Date(today);
            return { from: y, to: yEnd };
        }
        case '7d':
            return { from: (0, ist_day_util_1.daysAgo)(7), to: new Date() };
        case '30d':
            return { from: (0, ist_day_util_1.daysAgo)(30), to: new Date() };
        case '90d':
            return { from: (0, ist_day_util_1.daysAgo)(90), to: new Date() };
        case 'custom':
            return {
                from: from ? (0, ist_day_util_1.startOfIstDay)(new Date(from)) : (0, ist_day_util_1.daysAgo)(7),
                to: to ? new Date(to) : new Date(),
            };
        default:
            return { from: (0, ist_day_util_1.daysAgo)(7), to: new Date() };
    }
}
let AnalyticsService = class AnalyticsService {
    constructor(snapshots, cache, aggregator, alerts, exportSvc, tracking, prisma) {
        this.snapshots = snapshots;
        this.cache = cache;
        this.aggregator = aggregator;
        this.alerts = alerts;
        this.exportSvc = exportSvc;
        this.tracking = tracking;
        this.prisma = prisma;
    }
    async getPlatformMetricsForDate(date) {
        const snap = await this.snapshots.getDaily(client_1.AnalyticsSnapshotScope.PLATFORM, null, date);
        if (snap)
            return snap.metrics;
        return null;
    }
    async ensureTodaySnapshot() {
        const today = (0, ist_day_util_1.startOfIstDay)();
        const cached = await this.cache.get(this.cache.key(['executive', 'latest']));
        const existing = await this.getPlatformMetricsForDate(today);
        if (existing)
            return existing;
        const metrics = await this.aggregator.aggregatePlatformDaily(today);
        await this.snapshots.upsertDaily(client_1.AnalyticsSnapshotScope.PLATFORM, null, today, metrics);
        if (!cached)
            await this.cache.set(this.cache.key(['executive', 'latest']), metrics.executive, 300);
        return metrics;
    }
    async getExecutive() {
        const today = (0, ist_day_util_1.startOfIstDay)();
        const metrics = await this.ensureTodaySnapshot();
        const yesterdayMetrics = await this.getPlatformMetricsForDate((0, ist_day_util_1.daysAgo)(1));
        return {
            asOf: today.toISOString().slice(0, 10),
            source: 'snapshot',
            ...metrics.executive,
            priorDay: yesterdayMetrics?.executive ?? null,
        };
    }
    async getSales(granularity, compare) {
        const { from, to } = parseRange('30d');
        const hourly = await this.snapshots.listHourly(client_1.AnalyticsSnapshotScope.PLATFORM, null, from, to);
        const daily = await this.snapshots.listDaily(client_1.AnalyticsSnapshotScope.PLATFORM, null, from, to);
        const series = this.buildSalesSeries(granularity, hourly, daily);
        const comparisons = await this.buildComparisons(compare, granularity, hourly, daily);
        return { granularity, series, comparisons, source: 'snapshot' };
    }
    buildSalesSeries(granularity, hourly, daily) {
        if (granularity === 'hourly') {
            return hourly.map((h) => {
                const m = h.metrics;
                return {
                    label: h.bucketAt.toISOString(),
                    orders: m.orders,
                    gmv: m.gmv,
                    revenue: m.revenue,
                };
            });
        }
        if (granularity === 'weekly' || granularity === 'monthly' || granularity === 'yearly') {
            const buckets = new Map();
            for (const d of daily) {
                const m = d.metrics.executive;
                const dt = new Date(d.snapshotDate);
                let key;
                if (granularity === 'weekly') {
                    const wk = Math.floor((dt.getUTCDate() - 1) / 7);
                    key = `${dt.getUTCFullYear()}-W${wk}`;
                }
                else if (granularity === 'monthly') {
                    key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
                }
                else {
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
            const m = d.metrics.executive;
            return {
                label: new Date(d.snapshotDate).toISOString().slice(0, 10),
                orders: m.orders,
                gmv: m.gmv,
                revenue: m.revenue,
            };
        });
    }
    async buildComparisons(compare, granularity, hourly, daily) {
        if (!compare)
            return null;
        const today = (0, ist_day_util_1.startOfIstDay)();
        const yesterday = (0, ist_day_util_1.daysAgo)(1);
        const thisWeekStart = (0, ist_day_util_1.startOfIstWeek)();
        const lastWeekStart = (0, ist_day_util_1.startOfIstWeek)((0, ist_day_util_1.daysAgo)(7));
        const thisMonthStart = (0, ist_day_util_1.startOfIstMonth)();
        const lastMonthStart = (0, ist_day_util_1.startOfIstMonth)(new Date(thisMonthStart.getTime() - 1));
        const sumRange = (start, end) => {
            const src = granularity === 'hourly' ? hourly : daily;
            let orders = 0;
            let gmv = 0;
            for (const row of src) {
                const at = granularity === 'hourly' ? row.bucketAt : row.snapshotDate;
                if (at >= start && at < end) {
                    const m = granularity === 'hourly'
                        ? row.metrics
                        : row.metrics.executive;
                    orders += m.orders;
                    gmv += 'gmv' in m ? m.gmv : m.gmv;
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
            where: { scope: client_1.AnalyticsSnapshotScope.STORE, snapshotDate: { gte: from, lte: to } },
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
    async acknowledgeAlert(id) {
        return this.alerts.acknowledge(id);
    }
    async exportData(format, range, type, from, to) {
        const { from: start, to: end } = parseRange(range, from, to);
        const daily = await this.snapshots.listDaily(client_1.AnalyticsSnapshotScope.PLATFORM, null, start, end);
        const metrics = daily.map((d) => d.metrics);
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
        const todayStart = (0, ist_day_util_1.startOfIstDay)();
        const [fleet, executive, alertList, trustAlerts, health] = await Promise.all([
            this.tracking.getFleetLive(),
            this.getExecutive(),
            this.alerts.listOpen(10),
            this.prisma.trustAlert.findMany({
                where: { status: 'OPEN' },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
            this.prisma.$queryRaw `SELECT 1::int AS ok`,
        ]);
        const [todayRevenue, lastHourRevenue, preparing, fraudAlerts, trustAlertCount] = await Promise.all([
            this.prisma.order.aggregate({
                where: { createdAt: { gte: todayStart }, status: { in: merchant_dashboard_utils_1.REVENUE_STATUSES } },
                _sum: { totalAmount: true },
            }),
            this.prisma.order.aggregate({
                where: {
                    createdAt: { gte: new Date(Date.now() - 3600_000) },
                    status: { in: merchant_dashboard_utils_1.REVENUE_STATUSES },
                },
                _sum: { totalAmount: true },
            }),
            this.prisma.order.count({
                where: { status: { in: [client_2.OrderStatus.PREPARING, client_2.OrderStatus.PACKING] } },
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
    async getMerchantSnapshot(storeId, period = '7d') {
        const days = period === '30d' ? 30 : 7;
        const from = (0, ist_day_util_1.daysAgo)(days);
        const snaps = await this.snapshots.listDaily(client_1.AnalyticsSnapshotScope.STORE, storeId, from, new Date());
        if (snaps.length === 0) {
            const today = await this.aggregator.aggregateStoreDaily(storeId, (0, ist_day_util_1.startOfIstDay)());
            return { source: 'live-fallback', period, rollup: today, series: [] };
        }
        return {
            source: 'snapshot',
            period,
            series: snaps.map((s) => ({ date: s.snapshotDate, metrics: s.metrics })),
            rollup: snaps[snaps.length - 1]?.metrics,
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [analytics_snapshot_service_1.AnalyticsSnapshotService,
        analytics_metrics_cache_service_1.AnalyticsMetricsCacheService,
        analytics_aggregator_service_1.AnalyticsAggregatorService,
        analytics_alert_service_1.AnalyticsAlertService,
        analytics_export_service_1.AnalyticsExportService,
        delivery_tracking_service_1.DeliveryTrackingService,
        prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map