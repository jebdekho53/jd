import { SearchEventType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export interface TrackSearchEventInput {
    eventType: SearchEventType;
    query?: string;
    buyerProfileId?: string;
    sessionId?: string;
    productId?: string;
    storeId?: string;
    categoryId?: string;
    lat?: number;
    lng?: number;
    metadata?: Record<string, unknown>;
}
export declare class SearchAnalyticsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    track(input: TrackSearchEventInput): void;
    private sinceForPeriod;
    getTrendingQueries(period: '24h' | '7d' | '30d', limit?: number): Promise<any>;
    getAdminAnalytics(period?: '24h' | '7d' | '30d'): Promise<{
        period: "30d" | "7d" | "24h";
        topSearches: any;
        noResultSearches: any;
        lowConversionSearches: any;
        conversionRate: number;
        clickThroughRate: number;
        trendingCategories: any;
        trendingStores: any;
    }>;
    getMerchantInsights(storeId: string, period?: '7d' | '30d'): Promise<{
        period: "30d" | "7d";
        impressions: any;
        clicks: any;
        ctr: number;
        addToCart: any;
        orders: any;
        conversionRate: number;
        topSearchedProducts: any;
        lostSearches: any;
    }>;
}
