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
            topSearches: {
                query: string;
                count: number;
            }[];
            noResultSearches: {
                query: string;
                count: number;
            }[];
            lowConversionSearches: {
                query: string;
                searches: number;
            }[];
            conversionRate: number;
            clickThroughRate: number;
            trendingCategories: {
                categoryId: string | null;
                name: string;
                count: number;
            }[];
            trendingStores: {
                storeId: string | null;
                name: string;
                count: number;
            }[];
        };
    }>;
}
export {};
