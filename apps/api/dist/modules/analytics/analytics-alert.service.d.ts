import { PrismaService } from '../../database/prisma.service';
import type { PlatformDailyMetrics } from './analytics-metrics.types';
export declare class AnalyticsAlertService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    listOpen(limit?: number): Promise<any>;
    acknowledge(id: string): Promise<any>;
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
