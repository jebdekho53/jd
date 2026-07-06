import { MembershipAnalyticsService } from './membership-analytics.service';
import { PrismaService } from '../../database/prisma.service';
export declare class AdminMembershipController {
    private readonly analytics;
    private readonly prisma;
    constructor(analytics: MembershipAnalyticsService, prisma: PrismaService);
    overview(): Promise<{
        success: boolean;
        data: {
            metrics: any;
            subscribers: any;
        };
    }>;
}
export declare class AdminMembershipAnalyticsController {
    private readonly analytics;
    constructor(analytics: MembershipAnalyticsService);
    membership(): Promise<{
        success: boolean;
        data: {
            mrr: number;
            activeSubscribers: any;
            churnRate: number;
            retention: number;
            freeDeliverySavings: number;
        };
    }>;
}
