import type { RequestUser } from '../../common/types';
import { SearchAnalyticsService } from './search-analytics.service';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';
declare class MerchantSearchInsightsQueryDto {
    period?: '7d' | '30d';
}
export declare class MerchantSearchInsightsController {
    private readonly analytics;
    private readonly dashboard;
    constructor(analytics: SearchAnalyticsService, dashboard: MerchantDashboardService);
    getInsights(user: RequestUser, storeId: string, query: MerchantSearchInsightsQueryDto): Promise<{
        success: boolean;
        data: {
            period: "30d" | "7d";
            impressions: any;
            clicks: any;
            ctr: number;
            addToCart: any;
            orders: any;
            conversionRate: number;
            topSearchedProducts: any;
            lostSearches: any;
        };
    }>;
}
export {};
