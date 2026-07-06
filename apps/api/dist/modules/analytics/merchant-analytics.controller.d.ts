import type { RequestUser } from '../../common/types';
import { AnalyticsService } from './analytics.service';
import { MerchantAnalyticsQueryDto } from './dto/analytics-query.dto';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';
export declare class MerchantAnalyticsController {
    private readonly analytics;
    private readonly dashboard;
    constructor(analytics: AnalyticsService, dashboard: MerchantDashboardService);
    getSnapshot(user: RequestUser, query: MerchantAnalyticsQueryDto): Promise<{
        success: boolean;
        data: {
            source: string;
            period: "30d" | "7d";
            series: any;
            rollup: any;
        };
    }>;
    getStore(user: RequestUser, storeId: string, query: MerchantAnalyticsQueryDto): Promise<{
        success: boolean;
        data: {
            source: string;
            period: "30d" | "7d";
            series: any;
            rollup: any;
        };
    }>;
}
