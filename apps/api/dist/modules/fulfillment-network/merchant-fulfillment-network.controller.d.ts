import { RequestUser } from '../../common/types';
import { FulfillmentNetworkService } from './fulfillment-network.service';
import { InventoryTransferService } from './inventory-transfer.service';
import { CreateTransferDto, NetworkQueryDto } from './dto/fulfillment.dto';
export declare class MerchantFulfillmentNetworkController {
    private readonly network;
    private readonly transfers;
    constructor(network: FulfillmentNetworkService, transfers: InventoryTransferService);
    overview(user: RequestUser, query: NetworkQueryDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    capacity(user: RequestUser, query: NetworkQueryDto): Promise<{
        success: boolean;
        data: {
            storeId: string;
            ordersPerHour: number;
            pickersAvailable: number;
            packingStations: number;
            currentLoadPct: number;
            peakLoadPct: number;
            backlogCount: number;
        }[];
    }>;
    transfersList(user: RequestUser, query: NetworkQueryDto): Promise<{
        success: boolean;
        data: ({
            items: {
                id: string;
                variantId: string;
                sku: string;
                quantity: number;
                transferId: string;
            }[];
            fromStore: {
                id: string;
                name: string;
                storeType: import("@prisma/client").$Enums.StoreType;
            };
            toStore: {
                id: string;
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
        })[];
    }>;
    rebalancing(user: RequestUser, query: NetworkQueryDto): Promise<{
        success: boolean;
        data: import("./rebalancing.service").RebalanceSuggestion[];
    }>;
    performance(user: RequestUser, query: NetworkQueryDto): Promise<{
        success: boolean;
        data: {
            fulfillmentAccuracy: number;
            transferSuccessRate: number;
            darkStorePerformance: number;
            avgPickTimeMins: number;
            avgPackTimeMins: number;
            capacityUtilization: number;
        };
    }>;
    createTransfer(user: RequestUser, dto: CreateTransferDto): Promise<{
        success: boolean;
        data: {
            items: {
                id: string;
                variantId: string;
                sku: string;
                quantity: number;
                transferId: string;
            }[];
            fromStore: {
                name: string;
            };
            toStore: {
                name: string;
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
        };
    }>;
    listInventoryTransfers(user: RequestUser, query: NetworkQueryDto): Promise<{
        success: boolean;
        data: ({
            items: {
                id: string;
                variantId: string;
                sku: string;
                quantity: number;
                transferId: string;
            }[];
            fromStore: {
                id: string;
                name: string;
                storeType: import("@prisma/client").$Enums.StoreType;
            };
            toStore: {
                id: string;
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
        })[];
    }>;
    approveTransfer(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: {
            items: {
                id: string;
                variantId: string;
                sku: string;
                quantity: number;
                transferId: string;
            }[];
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
        };
    }>;
    completeTransfer(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: ({
            items: {
                id: string;
                variantId: string;
                sku: string;
                quantity: number;
                transferId: string;
            }[];
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
        }) | null;
    }>;
}
