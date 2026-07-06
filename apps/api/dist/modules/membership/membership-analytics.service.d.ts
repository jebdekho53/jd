import { PrismaService } from '../../database/prisma.service';
export declare class MembershipAnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAdminAnalytics(): Promise<{
        mrr: number;
        activeSubscribers: any;
        churnRate: number;
        retention: number;
        freeDeliverySavings: number;
    }>;
    getMemberSavings(userId: string): Promise<{
        savings: number;
        usages: number;
        plan?: undefined;
    } | {
        savings: number;
        usages: any;
        plan: any;
    }>;
}
