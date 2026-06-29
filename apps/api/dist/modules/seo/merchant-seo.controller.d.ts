import { RequestUser } from '../../common/types';
import { PrismaService } from '../../database/prisma.service';
import { SeoAnalyticsService } from './seo-analytics.service';
export declare class MerchantSeoController {
    private readonly prisma;
    private readonly analytics;
    constructor(prisma: PrismaService, analytics: SeoAnalyticsService);
    private primaryStoreId;
    overview(user: RequestUser): Promise<{
        success: boolean;
        data: {};
    } | {
        success: boolean;
        data: {
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
        } | null;
    }>;
    recommendations(user: RequestUser): Promise<{
        success: boolean;
        data: {
            recommendations: string[];
        };
    }>;
}
