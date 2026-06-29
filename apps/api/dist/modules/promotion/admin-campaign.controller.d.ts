import { RequestUser } from '../../common/types';
import { CampaignService } from './campaign.service';
import { CampaignAnalyticsService } from './campaign-analytics.service';
import { CreateCampaignDto, ListCampaignsDto, UpdateCampaignDto } from './dto/campaign.dto';
export declare class AdminCampaignController {
    private readonly campaigns;
    private readonly analytics;
    constructor(campaigns: CampaignService, analytics: CampaignAnalyticsService);
    list(dto: ListCampaignsDto): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            description: string | null;
            scope: import("@prisma/client").$Enums.CampaignScope;
            storeId: string | null;
            status: import("@prisma/client").$Enums.CampaignStatus;
            stackMode: import("@prisma/client").$Enums.OfferStackMode;
            startsAt: string;
            endsAt: string;
            budgetCap: number | null;
            spentAmount: number;
            impressionCount: number;
            clickCount: number;
            orderCount: number;
            gmvGenerated: number;
            offerCount: number | undefined;
            store: {} | undefined;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    analyticsSummary(): Promise<{
        success: boolean;
        data: {
            summary: {
                totalCampaigns: number;
                totalGmv: number;
                totalSpent: number;
                impressions: number;
                clicks: number;
                redemptions: number;
                discountGiven: number;
                incrementalRevenue: number;
                events: {
                    [k: string]: number;
                };
            };
            leaderboard: {
                rank: number;
                campaignId: string;
                name: string;
                scope: import("@prisma/client").$Enums.CampaignScope;
                store: {
                    id: string;
                    name: string;
                    slug: string;
                } | null;
                gmvGenerated: number;
                orderCount: number;
                impressions: number;
                clicks: number;
                conversion: number;
            }[];
            fraud: {
                couponAbuseCandidates: number;
                offerAbuseCandidates: number;
                refundImpactAmount: number;
                refundAffectedRedemptions: number;
                topOfferAbusers: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.OfferUsageGroupByOutputType, ("buyerProfileId" | "offerId")[]> & {
                    _count: {
                        id: number;
                    };
                })[];
            };
        };
    }>;
    create(user: RequestUser, dto: CreateCampaignDto): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            description: string | null;
            scope: import("@prisma/client").$Enums.CampaignScope;
            storeId: string | null;
            status: import("@prisma/client").$Enums.CampaignStatus;
            stackMode: import("@prisma/client").$Enums.OfferStackMode;
            startsAt: string;
            endsAt: string;
            budgetCap: number | null;
            spentAmount: number;
            impressionCount: number;
            clickCount: number;
            orderCount: number;
            gmvGenerated: number;
            offerCount: number | undefined;
            store: {} | undefined;
        };
    }>;
    update(user: RequestUser, id: string, dto: UpdateCampaignDto): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            description: string | null;
            scope: import("@prisma/client").$Enums.CampaignScope;
            storeId: string | null;
            status: import("@prisma/client").$Enums.CampaignStatus;
            stackMode: import("@prisma/client").$Enums.OfferStackMode;
            startsAt: string;
            endsAt: string;
            budgetCap: number | null;
            spentAmount: number;
            impressionCount: number;
            clickCount: number;
            orderCount: number;
            gmvGenerated: number;
            offerCount: number | undefined;
            store: {} | undefined;
        };
    }>;
    pause(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            description: string | null;
            scope: import("@prisma/client").$Enums.CampaignScope;
            storeId: string | null;
            status: import("@prisma/client").$Enums.CampaignStatus;
            stackMode: import("@prisma/client").$Enums.OfferStackMode;
            startsAt: string;
            endsAt: string;
            budgetCap: number | null;
            spentAmount: number;
            impressionCount: number;
            clickCount: number;
            orderCount: number;
            gmvGenerated: number;
            offerCount: number | undefined;
            store: {} | undefined;
        };
    }>;
    resume(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            description: string | null;
            scope: import("@prisma/client").$Enums.CampaignScope;
            storeId: string | null;
            status: import("@prisma/client").$Enums.CampaignStatus;
            stackMode: import("@prisma/client").$Enums.OfferStackMode;
            startsAt: string;
            endsAt: string;
            budgetCap: number | null;
            spentAmount: number;
            impressionCount: number;
            clickCount: number;
            orderCount: number;
            gmvGenerated: number;
            offerCount: number | undefined;
            store: {} | undefined;
        };
    }>;
}
