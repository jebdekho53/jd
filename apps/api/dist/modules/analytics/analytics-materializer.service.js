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
var AnalyticsMaterializerService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsMaterializerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const analytics_aggregator_service_1 = require("./analytics-aggregator.service");
const analytics_snapshot_service_1 = require("./analytics-snapshot.service");
const analytics_alert_service_1 = require("./analytics-alert.service");
const analytics_metrics_cache_service_1 = require("./analytics-metrics-cache.service");
const prisma_service_1 = require("../../database/prisma.service");
const ist_day_util_1 = require("../../common/utils/ist-day.util");
let AnalyticsMaterializerService = AnalyticsMaterializerService_1 = class AnalyticsMaterializerService {
    constructor(aggregator, snapshots, alerts, cache, prisma, events) {
        this.aggregator = aggregator;
        this.snapshots = snapshots;
        this.alerts = alerts;
        this.cache = cache;
        this.prisma = prisma;
        this.events = events;
        this.logger = new common_1.Logger(AnalyticsMaterializerService_1.name);
    }
    async materializeHourly() {
        const now = new Date();
        const bucket = new Date(now);
        bucket.setUTCMinutes(0, 0, 0);
        try {
            const metrics = await this.aggregator.aggregateHourly(bucket);
            await this.snapshots.upsertHourly(client_1.AnalyticsSnapshotScope.PLATFORM, null, bucket, metrics);
            const today = (0, ist_day_util_1.startOfIstDay)();
            const platformDaily = await this.aggregator.aggregatePlatformDaily(today);
            await this.snapshots.upsertDaily(client_1.AnalyticsSnapshotScope.PLATFORM, null, today, platformDaily);
            await this.cache.set(this.cache.key(['executive', 'latest']), platformDaily.executive, 900);
            this.events.emit('analytics.materialized', { type: 'hourly', at: now.toISOString() });
            this.logger.log(`Hourly analytics materialized for ${bucket.toISOString()}`);
        }
        catch (err) {
            this.logger.error('Hourly materialization failed', err instanceof Error ? err.stack : String(err));
        }
    }
    async materializeDaily() {
        const yesterday = (0, ist_day_util_1.daysAgo)(1);
        try {
            const prev = (0, ist_day_util_1.daysAgo)(2);
            const platformDaily = await this.aggregator.aggregatePlatformDaily(yesterday, prev);
            await this.snapshots.upsertDaily(client_1.AnalyticsSnapshotScope.PLATFORM, null, yesterday, platformDaily);
            const stores = await this.prisma.store.findMany({
                where: { deletedAt: null, status: 'APPROVED' },
                select: { id: true },
                take: 500,
            });
            for (const store of stores) {
                const storeMetrics = await this.aggregator.aggregateStoreDaily(store.id, yesterday);
                await this.snapshots.upsertDaily(client_1.AnalyticsSnapshotScope.STORE, store.id, yesterday, storeMetrics);
            }
            await this.alerts.evaluateAfterDailySnapshot(platformDaily, yesterday);
            await this.cache.set(this.cache.key(['executive', 'latest']), platformDaily.executive, 86_400);
            this.events.emit('analytics.materialized', { type: 'daily', date: yesterday.toISOString().slice(0, 10) });
            this.logger.log(`Daily analytics materialized for ${yesterday.toISOString().slice(0, 10)}`);
        }
        catch (err) {
            this.logger.error('Daily materialization failed', err instanceof Error ? err.stack : String(err));
        }
    }
    async materializeNow() {
        await this.materializeHourly();
    }
};
exports.AnalyticsMaterializerService = AnalyticsMaterializerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsMaterializerService.prototype, "materializeHourly", null);
__decorate([
    (0, schedule_1.Cron)('30 1 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsMaterializerService.prototype, "materializeDaily", null);
exports.AnalyticsMaterializerService = AnalyticsMaterializerService = AnalyticsMaterializerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [analytics_aggregator_service_1.AnalyticsAggregatorService,
        analytics_snapshot_service_1.AnalyticsSnapshotService,
        analytics_alert_service_1.AnalyticsAlertService,
        analytics_metrics_cache_service_1.AnalyticsMetricsCacheService,
        prisma_service_1.PrismaService, typeof (_a = typeof event_emitter_1.EventEmitter2 !== "undefined" && event_emitter_1.EventEmitter2) === "function" ? _a : Object])
], AnalyticsMaterializerService);
//# sourceMappingURL=analytics-materializer.service.js.map