import { AnalyticsSnapshotScope } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { HourlyMetrics, MerchantRollupMetrics, PlatformDailyMetrics } from './analytics-metrics.types';
export declare class AnalyticsSnapshotService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    upsertDaily(scope: AnalyticsSnapshotScope, scopeId: string | null, snapshotDate: Date, metrics: PlatformDailyMetrics | MerchantRollupMetrics | Record<string, unknown>): Promise<any>;
    upsertHourly(scope: AnalyticsSnapshotScope, scopeId: string | null, bucketAt: Date, metrics: HourlyMetrics): Promise<any>;
    getDaily(scope: AnalyticsSnapshotScope, scopeId: string | null, snapshotDate: Date): Promise<any>;
    listDaily(scope: AnalyticsSnapshotScope, scopeId: string | null, from: Date, to: Date): Promise<any>;
    listHourly(scope: AnalyticsSnapshotScope, scopeId: string | null, from: Date, to: Date): Promise<any>;
}
