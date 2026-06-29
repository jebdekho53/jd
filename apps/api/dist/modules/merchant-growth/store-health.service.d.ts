import { PrismaService } from '../../database/prisma.service';
import { StoreReputationService } from '../store-review/store-reputation.service';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';
import { SearchAnalyticsService } from '../search-discovery/search-analytics.service';
import { MerchantCrmService } from '../crm/merchant-crm.service';
export interface HealthBreakdown {
    fulfillment: number;
    ratings: number;
    inventory: number;
    retention: number;
    deliverySla: number;
    campaign: number;
}
export interface StoreHealthResult {
    score: number;
    breakdown: HealthBreakdown;
    metrics: {
        fulfillmentRate: number;
        cancellationRate: number;
        averageRating: number;
        ratingTrend: 'up' | 'down' | 'stable';
        lowStockSkus: number;
        outOfStockSkus: number;
        repeatCustomerPct: number;
        avgDeliveryMins: number;
        deliverySlaPct: number;
        visibilityScore: number;
        campaignActivityPct: number;
    };
}
export declare class StoreHealthService {
    private readonly prisma;
    private readonly reputation;
    private readonly dashboard;
    private readonly searchAnalytics;
    private readonly merchantCrm;
    constructor(prisma: PrismaService, reputation: StoreReputationService, dashboard: MerchantDashboardService, searchAnalytics: SearchAnalyticsService, merchantCrm: MerchantCrmService);
    computeForStore(storeId: string, userId: string): Promise<StoreHealthResult>;
}
