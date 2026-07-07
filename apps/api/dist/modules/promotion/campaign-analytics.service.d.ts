import { CampaignEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class CampaignAnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    trackEvent(input: {
        campaignId: string;
        offerId?: string;
        eventType: CampaignEventType;
        buyerProfileId?: string;
        storeId?: string;
        metadata?: Record<string, unknown>;
    }): Promise<void>;
    getLeaderboard(limit?: number): Promise<{
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
    }[]>;
    getFraudSignals(): Promise<{
        couponAbuseCandidates: number;
        offerAbuseCandidates: number;
        refundImpactAmount: number;
        refundAffectedRedemptions: number;
        topOfferAbusers: (Prisma.PickEnumerable<Prisma.OfferUsageGroupByOutputType, ("buyerProfileId" | "offerId")[]> & {
            _count: {
                id: number;
            };
        })[];
    }>;
    getPlatformSummary(): Promise<{
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
    }>;
}
