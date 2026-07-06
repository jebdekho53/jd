import { PrismaService } from '../../database/prisma.service';
export declare class AdAnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getCampaignMetrics(campaignId: string): Promise<{
        impressions: any;
        clicks: any;
        ctr: number;
        conversions: any;
        revenue: any;
        spend: number;
        roas: number;
    }>;
    getMerchantAnalytics(advertiserId: string): Promise<any>;
    getAdminAnalytics(): Promise<{
        revenue: number;
        adSpend: number;
        roas: number;
        ctr: number;
        advertisers: any;
        impressions: any;
        clicks: any;
    }>;
}
