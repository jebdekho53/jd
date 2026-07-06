import { PrismaService } from '../../database/prisma.service';
import { AdAnalyticsService } from './ad-analytics.service';
export declare class AdminAdsController {
    private readonly prisma;
    private readonly analytics;
    constructor(prisma: PrismaService, analytics: AdAnalyticsService);
    overview(): Promise<{
        success: boolean;
        data: {
            metrics: any;
            topAdvertisers: any;
            campaigns: any;
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
            advertisers: any;
            impressions: any;
            clicks: any;
        };
    }>;
}
