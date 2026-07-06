import { SearchAnalyticsService } from './search-analytics.service';
declare class AdminSearchAnalyticsQueryDto {
    period?: '24h' | '7d' | '30d';
}
export declare class AdminSearchAnalyticsController {
    private readonly analytics;
    constructor(analytics: SearchAnalyticsService);
    getAnalytics(query: AdminSearchAnalyticsQueryDto): Promise<{
        success: boolean;
        data: {
            period: "30d" | "7d" | "24h";
            topSearches: any;
            noResultSearches: any;
            lowConversionSearches: any;
            conversionRate: number;
            clickThroughRate: number;
            trendingCategories: any;
            trendingStores: any;
        };
    }>;
}
export {};
