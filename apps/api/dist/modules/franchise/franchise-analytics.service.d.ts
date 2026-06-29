import { PrismaService } from '../../database/prisma.service';
export declare class FranchiseAnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAdminFranchiseAnalytics(): Promise<{
        activeFranchises: number;
        platformGmv30d: number;
        franchiseGmvTotal: number;
        franchiseShareTotal: number;
        ordersDelivered30d: number;
        cityGmv: {
            city: string;
            state: string;
            gmv: number;
            readinessScore: number;
            launchStatus: import("@prisma/client").$Enums.CityLaunchStatus;
        }[];
        expansionPipeline: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.CityLaunchPlanGroupByOutputType, "launchStatus"[]> & {
            _count: {
                id: number;
            };
        })[];
        territoryUtilization: number;
    }>;
    getFranchiseDashboard(franchiseId: string): Promise<{
        businessName: string;
        status: import("@prisma/client").$Enums.FranchisePartnerStatus;
        gmv30d: number;
        orders30d: number;
        revenueShare: number;
        commissionPercent: number;
        storeCount: number;
        riderCount: number;
        territories: {
            city: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            state: string;
            pincodes: string[];
            country: string;
            franchiseId: string;
            exclusivityEnabled: boolean;
            launchDate: Date | null;
        }[];
        pincodes: string[];
    } | null>;
}
