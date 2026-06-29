import { EventEmitter2 } from '@nestjs/event-emitter';
import { AnalyticsAggregatorService } from './analytics-aggregator.service';
import { AnalyticsSnapshotService } from './analytics-snapshot.service';
import { AnalyticsAlertService } from './analytics-alert.service';
import { AnalyticsMetricsCacheService } from './analytics-metrics-cache.service';
import { PrismaService } from '../../database/prisma.service';
export declare class AnalyticsMaterializerService {
    private readonly aggregator;
    private readonly snapshots;
    private readonly alerts;
    private readonly cache;
    private readonly prisma;
    private readonly events;
    private readonly logger;
    constructor(aggregator: AnalyticsAggregatorService, snapshots: AnalyticsSnapshotService, alerts: AnalyticsAlertService, cache: AnalyticsMetricsCacheService, prisma: PrismaService, events: EventEmitter2);
    materializeHourly(): Promise<void>;
    materializeDaily(): Promise<void>;
    materializeNow(): Promise<void>;
}
