import { PrismaService } from '../../database/prisma.service';
import { CustomerTimelineService } from '../support/customer-timeline.service';
export declare class Customer360Service {
    private readonly prisma;
    private readonly timeline;
    constructor(prisma: PrismaService, timeline: CustomerTimelineService);
    getProfile(userId: string): Promise<{
        user: {
            id: any;
            phone: any;
            email: any;
            name: any;
            createdAt: any;
        };
        segments: any;
        tags: any;
        preferences: any;
        wallet: any;
        orders: any;
        carts: any;
        timeline: any;
        searches: any;
        campaignEngagement: any;
        notificationHistory: any;
        metrics: {
            totalOrders: any;
            lifetimeValue: number;
        };
    }>;
}
