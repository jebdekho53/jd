import { PrismaService } from '../../database/prisma.service';
import type { HourlyMetrics, MerchantRollupMetrics, PlatformDailyMetrics } from './analytics-metrics.types';
export declare class AnalyticsAggregatorService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    aggregateHourly(bucketAt: Date, storeId?: string): Promise<HourlyMetrics>;
    aggregatePlatformDaily(date: Date, prevDate?: Date): Promise<PlatformDailyMetrics>;
    aggregateStoreDaily(storeId: string, date: Date): Promise<MerchantRollupMetrics>;
    private buildExecutive;
    private buildOrderAnalytics;
    private buildCustomerAnalytics;
    private buildRiderAnalytics;
    private buildGeoAnalytics;
    private buildInventoryAnalytics;
    private buildWalletRewards;
    private buildFunnel;
}
