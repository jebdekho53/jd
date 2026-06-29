import { PrismaService } from '../../database/prisma.service';
export declare class AdAnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getCampaignMetrics(campaignId: string): Promise<{
        impressions: number;
        clicks: number;
        ctr: number;
        conversions: number;
        revenue: number;
        spend: number;
        roas: number;
    }>;
    getMerchantAnalytics(advertiserId: string): Promise<{
        ctr: number;
        roas: number;
        campaigns: number;
        impressions: number;
        clicks: number;
        conversions: number;
        revenue: number;
        spend: number;
    }>;
    getAdminAnalytics(): Promise<{
        revenue: number;
        adSpend: number;
        roas: number;
        ctr: number;
        advertisers: number;
        impressions: number;
        clicks: number;
    }>;
}
