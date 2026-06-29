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
    getTrendingQueries(period: '24h' | '7d' | '30d', limit?: number): Promise<{
        query: string;
        count: number;
    }[]>;
    getAdminAnalytics(period?: '24h' | '7d' | '30d'): Promise<{
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
    }>;
    getMerchantInsights(storeId: string, period?: '7d' | '30d'): Promise<{
        period: "30d" | "7d";
        impressions: number;
        clicks: number;
        ctr: number;
        addToCart: number;
        orders: number;
        conversionRate: number;
        topSearchedProducts: {
            query: string;
            count: number;
        }[];
        lostSearches: {
            query: string;
            count: number;
        }[];
    }>;
}
