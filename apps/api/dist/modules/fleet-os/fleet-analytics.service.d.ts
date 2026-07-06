import { PrismaService } from '../../database/prisma.service';
export declare class FleetAnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAdminFleetAnalytics(): Promise<{
        riderUtilization: number;
        avgBatchSize: number;
        routeEfficiency: number;
        deliveryCostSavings: number;
        clusterDemandRatios: any;
        activeBatches: any;
    }>;
}
