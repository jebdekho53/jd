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
        data: ({
            sponsoredProducts: {
                id: string;
                productId: string;
                priority: number;
                campaignId: string;
            }[];
            keywordBids: {
                id: string;
                createdAt: Date;
                campaignId: string;
                keyword: string;
                bidAmount: import("@prisma/client/runtime/library").Decimal;
            }[];
        } & {
            id: string;
            status: import("@prisma/client").$Enums.AdCampaignStatus;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            spentAmount: import("@prisma/client/runtime/library").Decimal;
            advertiserId: string;
            budget: import("@prisma/client/runtime/library").Decimal;
            startAt: Date | null;
            endAt: Date | null;
        })[];
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
        data: {
            id: string;
            status: import("@prisma/client").$Enums.AdCampaignStatus;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            spentAmount: import("@prisma/client/runtime/library").Decimal;
            advertiserId: string;
            budget: import("@prisma/client/runtime/library").Decimal;
            startAt: Date | null;
            endAt: Date | null;
        };
        message?: undefined;
    }>;
    analytics(user: RequestUser): Promise<{
        success: boolean;
        data: {};
    } | {
        success: boolean;
        data: {
            ctr: number;
            roas: number;
            campaigns: number;
            impressions: number;
            clicks: number;
            conversions: number;
            revenue: number;
            spend: number;
        };
    }>;
}
