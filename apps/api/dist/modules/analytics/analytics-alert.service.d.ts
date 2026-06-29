import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { PlatformDailyMetrics } from './analytics-metrics.types';
export declare class AnalyticsAlertService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    listOpen(limit?: number): Promise<{
        message: string;
        id: string;
        status: import("@prisma/client").$Enums.AnalyticsAlertStatus;
        metadata: Prisma.JsonValue | null;
        createdAt: Date;
        severity: import("@prisma/client").$Enums.AnalyticsAlertSeverity;
        title: string;
        resolvedAt: Date | null;
        alertType: string;
    }[]>;
    acknowledge(id: string): Promise<{
        message: string;
        id: string;
        status: import("@prisma/client").$Enums.AnalyticsAlertStatus;
        metadata: Prisma.JsonValue | null;
        createdAt: Date;
        severity: import("@prisma/client").$Enums.AnalyticsAlertSeverity;
        title: string;
        resolvedAt: Date | null;
        alertType: string;
    }>;
    evaluateAfterDailySnapshot(metrics: PlatformDailyMetrics, date: Date): Promise<void>;
    private raise;
    private checkOrderSpike;
    private checkRevenueDrop;
    private checkRiderAvailability;
    private checkInventoryCrisis;
    private checkWalletFraud;
    private checkReferralFraud;
    private checkMerchantPerformance;
}
