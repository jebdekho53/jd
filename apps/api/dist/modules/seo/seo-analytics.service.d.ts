import { PrismaService } from '../../database/prisma.service';
export declare class SeoAnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    recordDailySnapshot(): Promise<{
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        snapshotDate: Date;
        ctr: number;
        organicTraffic: number;
        keywordRankings: import("@prisma/client/runtime/library").JsonValue;
        aiCitations: number;
        featuredSnippetWins: number;
        geoVisibilityScore: number;
        aeoVisibilityScore: number;
    }>;
    getAdminOverview(): Promise<{
        indexedPages: number;
        sitemapStatus: {
            type: import("@prisma/client").$Enums.SitemapType;
            urlCount: number;
            lastGeneratedAt: Date;
        }[];
        topKeywords: {
            id: string;
            createdAt: Date;
            storeId: string | null;
            impressions: number;
            clicks: number;
            keyword: string;
            ctr: number;
            pageId: string | null;
            avgPosition: number | null;
            trackedAt: Date;
        }[];
        crawlHealth: {
            visits24h: number;
        };
        metrics: {
            organicTraffic: number;
            ctr: number;
            aiCitations: number;
            geoVisibilityScore: number;
            aeoVisibilityScore: number;
        };
        trend: {
            id: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            snapshotDate: Date;
            ctr: number;
            organicTraffic: number;
            keywordRankings: import("@prisma/client/runtime/library").JsonValue;
            aiCitations: number;
            featuredSnippetWins: number;
            geoVisibilityScore: number;
            aeoVisibilityScore: number;
        }[];
    }>;
    getMerchantOverview(storeId: string): Promise<{
        store: {
            name: string;
            description: string | null;
            ratingAvg: number;
            ratingCount: number;
            slug: string;
            logoUrl: string | null;
        };
        visibilityScore: number;
        searchImpressions: number;
        topKeywords: {
            id: string;
            createdAt: Date;
            storeId: string | null;
            impressions: number;
            clicks: number;
            keyword: string;
            ctr: number;
            pageId: string | null;
            avgPosition: number | null;
            trackedAt: Date;
        }[];
        missingMetadata: string[];
        recommendations: string[];
    } | null>;
    private buildRecommendations;
    trackSearchKeyword(keyword: string, storeId?: string): Promise<{
        id: string;
        createdAt: Date;
        storeId: string | null;
        impressions: number;
        clicks: number;
        keyword: string;
        ctr: number;
        pageId: string | null;
        avgPosition: number | null;
        trackedAt: Date;
    } | undefined>;
}
