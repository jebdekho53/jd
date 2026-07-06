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
            store: any;
            visibilityScore: number;
            searchImpressions: any;
            topKeywords: any;
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
