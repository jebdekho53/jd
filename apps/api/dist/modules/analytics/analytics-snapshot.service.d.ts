import { AnalyticsSnapshotScope, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { HourlyMetrics, MerchantRollupMetrics, PlatformDailyMetrics } from './analytics-metrics.types';
export declare class AnalyticsSnapshotService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    upsertDaily(scope: AnalyticsSnapshotScope, scopeId: string | null, snapshotDate: Date, metrics: PlatformDailyMetrics | MerchantRollupMetrics | Record<string, unknown>): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scope: import("@prisma/client").$Enums.AnalyticsSnapshotScope;
        metrics: Prisma.JsonValue;
        scopeId: string | null;
        snapshotDate: Date;
    }>;
    upsertHourly(scope: AnalyticsSnapshotScope, scopeId: string | null, bucketAt: Date, metrics: HourlyMetrics): Promise<{
        id: string;
        createdAt: Date;
        scope: import("@prisma/client").$Enums.AnalyticsSnapshotScope;
        metrics: Prisma.JsonValue;
        scopeId: string | null;
        bucketAt: Date;
    }>;
    getDaily(scope: AnalyticsSnapshotScope, scopeId: string | null, snapshotDate: Date): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scope: import("@prisma/client").$Enums.AnalyticsSnapshotScope;
        metrics: Prisma.JsonValue;
        scopeId: string | null;
        snapshotDate: Date;
    } | null>;
    listDaily(scope: AnalyticsSnapshotScope, scopeId: string | null, from: Date, to: Date): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        scope: import("@prisma/client").$Enums.AnalyticsSnapshotScope;
        metrics: Prisma.JsonValue;
        scopeId: string | null;
        snapshotDate: Date;
    }[]>;
    listHourly(scope: AnalyticsSnapshotScope, scopeId: string | null, from: Date, to: Date): Promise<{
        id: string;
        createdAt: Date;
        scope: import("@prisma/client").$Enums.AnalyticsSnapshotScope;
        metrics: Prisma.JsonValue;
        scopeId: string | null;
        bucketAt: Date;
    }[]>;
}
