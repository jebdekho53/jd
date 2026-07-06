import { CampaignEventType } from '@prisma/client';
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
    getLeaderboard(limit?: number): Promise<any>;
    getFraudSignals(): Promise<{
        couponAbuseCandidates: any;
        offerAbuseCandidates: any;
        refundImpactAmount: number;
        refundAffectedRedemptions: any;
        topOfferAbusers: any;
    }>;
    getPlatformSummary(): Promise<{
        totalCampaigns: any;
        totalGmv: number;
        totalSpent: number;
        impressions: any;
        clicks: any;
        redemptions: any;
        discountGiven: number;
        incrementalRevenue: number;
        events: {
            [k: string]: any;
        };
    }>;
}
