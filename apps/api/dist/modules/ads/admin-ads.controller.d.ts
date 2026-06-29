import { PrismaService } from '../../database/prisma.service';
import { AdAnalyticsService } from './ad-analytics.service';
export declare class AdminAdsController {
    private readonly prisma;
    private readonly analytics;
    constructor(prisma: PrismaService, analytics: AdAnalyticsService);
    overview(): Promise<{
        success: boolean;
        data: {
            metrics: {
                revenue: number;
                adSpend: number;
                roas: number;
                ctr: number;
                advertisers: number;
                impressions: number;
                clicks: number;
            };
            topAdvertisers: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.AdCampaignGroupByOutputType, "advertiserId"[]> & {
                _sum: {
                    spentAmount: import("@prisma/client/runtime/library").Decimal | null;
                };
            })[];
            campaigns: ({
                advertiser: {
                    businessName: string;
                };
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
        };
    }>;
}
export declare class AdminAdsAnalyticsController {
    private readonly analytics;
    constructor(analytics: AdAnalyticsService);
    ads(): Promise<{
        success: boolean;
        data: {
            revenue: number;
            adSpend: number;
            roas: number;
            ctr: number;
            advertisers: number;
            impressions: number;
            clicks: number;
        };
    }>;
}
