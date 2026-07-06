import { PrismaService } from '../../database/prisma.service';
export declare class FranchiseAnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAdminFranchiseAnalytics(): Promise<{
        activeFranchises: any;
        platformGmv30d: number;
        franchiseGmvTotal: number;
        franchiseShareTotal: number;
        ordersDelivered30d: any;
        cityGmv: any;
        expansionPipeline: any;
        territoryUtilization: number;
    }>;
    getFranchiseDashboard(franchiseId: string): Promise<{
        businessName: any;
        status: any;
        gmv30d: number;
        orders30d: any;
        revenueShare: number;
        commissionPercent: any;
        storeCount: any;
        riderCount: any;
        territories: any;
        pincodes: any;
    } | null>;
}
