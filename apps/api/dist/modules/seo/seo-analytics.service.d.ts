import { PrismaService } from '../../database/prisma.service';
export declare class SeoAnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    recordDailySnapshot(): Promise<any>;
    getAdminOverview(): Promise<{
        indexedPages: any;
        sitemapStatus: any;
        topKeywords: any;
        crawlHealth: {
            visits24h: any;
        };
        metrics: {
            organicTraffic: any;
            ctr: any;
            aiCitations: any;
            geoVisibilityScore: any;
            aeoVisibilityScore: any;
        };
        trend: any;
    }>;
    getMerchantOverview(storeId: string): Promise<{
        store: any;
        visibilityScore: number;
        searchImpressions: any;
        topKeywords: any;
        missingMetadata: string[];
        recommendations: string[];
    } | null>;
    private buildRecommendations;
    trackSearchKeyword(keyword: string, storeId?: string): Promise<any>;
}
