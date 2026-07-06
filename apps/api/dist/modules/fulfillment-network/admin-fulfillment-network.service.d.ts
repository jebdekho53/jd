import { PrismaService } from '../../database/prisma.service';
export declare class AdminFulfillmentNetworkService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboard(): Promise<{
        activeNetworks: any;
        darkStores: any;
        pendingTransfers: any;
        splitOrderRatio: number;
        recentActivity: any;
    }>;
    listTransfers(): Promise<any>;
    getCapacityHeatmap(): Promise<any>;
    getSlaMetrics(): Promise<{
        fulfillmentSlaPct: number;
        avgEtaMins: number;
        ordersDelivered7d: any;
        pickTimeMins: number;
        packTimeMins: number;
    }>;
}
