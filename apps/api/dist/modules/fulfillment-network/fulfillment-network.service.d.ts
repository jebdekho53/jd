import { PrismaService } from '../../database/prisma.service';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';
import { CapacityService } from './capacity.service';
import { RebalancingService } from './rebalancing.service';
export declare class FulfillmentNetworkService {
    private readonly prisma;
    private readonly merchantDashboard;
    private readonly capacity;
    private readonly rebalancing;
    constructor(prisma: PrismaService, merchantDashboard: MerchantDashboardService, capacity: CapacityService, rebalancing: RebalancingService);
    getOverview(userId: string, storeId?: string): Promise<{
        stores: never[];
        darkStores: number;
        warehouses: number;
        splitOrderRatio: number;
        networkName: null;
        microFulfillment?: undefined;
    } | {
        networkName: any;
        stores: any;
        darkStores: any;
        warehouses: any;
        microFulfillment: any;
        splitOrderRatio: number;
    }>;
    getCapacity(userId: string, storeId?: string): Promise<{
        storeId: string;
        ordersPerHour: any;
        pickersAvailable: any;
        packingStations: any;
        currentLoadPct: any;
        peakLoadPct: any;
        backlogCount: any;
    }[]>;
    getTransfers(userId: string, storeId?: string): Promise<any>;
    getRebalancing(userId: string, storeId?: string): Promise<import("./rebalancing.service").RebalanceSuggestion[]>;
    getPerformance(userId: string, storeId?: string): Promise<{
        fulfillmentAccuracy: number;
        transferSuccessRate: any;
        darkStorePerformance: any;
        avgPickTimeMins: number;
        avgPackTimeMins: number;
        capacityUtilization: number;
    }>;
}
