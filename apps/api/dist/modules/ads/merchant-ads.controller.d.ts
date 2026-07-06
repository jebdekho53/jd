import { RequestUser } from '../../common/types';
import { PrismaService } from '../../database/prisma.service';
import { AdAnalyticsService } from './ad-analytics.service';
export declare class MerchantAdsController {
    private readonly prisma;
    private readonly adAnalytics;
    constructor(prisma: PrismaService, adAnalytics: AdAnalyticsService);
    private advertiserId;
    campaigns(user: RequestUser): Promise<{
        success: boolean;
        data: any;
    }>;
    createCampaign(user: RequestUser, body: {
        name: string;
        budget: number;
        productIds?: string[];
        keywords?: Array<{
            keyword: string;
            bidAmount: number;
        }>;
    }): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: any;
        message?: undefined;
    }>;
    analytics(user: RequestUser): Promise<{
        success: boolean;
        data: any;
    }>;
}
