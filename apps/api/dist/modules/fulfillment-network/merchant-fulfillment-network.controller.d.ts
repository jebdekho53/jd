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
            networkName: any;
            stores: any;
            darkStores: any;
            warehouses: any;
            microFulfillment: any;
            splitOrderRatio: number;
        };
    }>;
    capacity(user: RequestUser, query: NetworkQueryDto): Promise<{
        success: boolean;
        data: {
            storeId: string;
            ordersPerHour: any;
            pickersAvailable: any;
            packingStations: any;
            currentLoadPct: any;
            peakLoadPct: any;
            backlogCount: any;
        }[];
    }>;
    transfersList(user: RequestUser, query: NetworkQueryDto): Promise<{
        success: boolean;
        data: any;
    }>;
    rebalancing(user: RequestUser, query: NetworkQueryDto): Promise<{
        success: boolean;
        data: import("./rebalancing.service").RebalanceSuggestion[];
    }>;
    performance(user: RequestUser, query: NetworkQueryDto): Promise<{
        success: boolean;
        data: {
            fulfillmentAccuracy: number;
            transferSuccessRate: any;
            darkStorePerformance: any;
            avgPickTimeMins: number;
            avgPackTimeMins: number;
            capacityUtilization: number;
        };
    }>;
    createTransfer(user: RequestUser, dto: CreateTransferDto): Promise<{
        success: boolean;
        data: any;
    }>;
    listInventoryTransfers(user: RequestUser, query: NetworkQueryDto): Promise<{
        success: boolean;
        data: any;
    }>;
    approveTransfer(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    completeTransfer(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: any;
    }>;
}
