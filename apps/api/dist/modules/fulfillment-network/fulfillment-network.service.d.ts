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
        networkName: string;
        stores: {
            id: string;
            name: string;
            isActive: boolean;
            latitude: number;
            longitude: number;
            storeType: import("@prisma/client").$Enums.StoreType;
        }[];
        darkStores: number;
        warehouses: number;
        microFulfillment: number;
        splitOrderRatio: number;
    }>;
    getCapacity(userId: string, storeId?: string): Promise<{
        storeId: string;
        ordersPerHour: number;
        pickersAvailable: number;
        packingStations: number;
        currentLoadPct: number;
        peakLoadPct: number;
        backlogCount: number;
    }[]>;
    getTransfers(userId: string, storeId?: string): Promise<({
        items: {
            id: string;
            variantId: string;
            sku: string;
            quantity: number;
            transferId: string;
        }[];
        fromStore: {
            name: string;
            storeType: import("@prisma/client").$Enums.StoreType;
        };
        toStore: {
            name: string;
            storeType: import("@prisma/client").$Enums.StoreType;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.InventoryTransferStatus;
        completedAt: Date | null;
        cancelledAt: Date | null;
        notes: string | null;
        merchantProfileId: string;
        requestedAt: Date;
        requestedBy: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        fromStoreId: string;
        toStoreId: string;
    })[]>;
    getRebalancing(userId: string, storeId?: string): Promise<import("./rebalancing.service").RebalanceSuggestion[]>;
    getPerformance(userId: string, storeId?: string): Promise<{
        fulfillmentAccuracy: number;
        transferSuccessRate: number;
        darkStorePerformance: number;
        avgPickTimeMins: number;
        avgPackTimeMins: number;
        capacityUtilization: number;
    }>;
}
