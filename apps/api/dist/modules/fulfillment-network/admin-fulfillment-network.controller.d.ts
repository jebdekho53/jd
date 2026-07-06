import { AdminFulfillmentNetworkService } from './admin-fulfillment-network.service';
export declare class AdminFulfillmentNetworkController {
    private readonly admin;
    constructor(admin: AdminFulfillmentNetworkService);
    dashboard(): Promise<{
        success: boolean;
        data: {
            activeNetworks: any;
            darkStores: any;
            pendingTransfers: any;
            splitOrderRatio: number;
            recentActivity: any;
        };
    }>;
    transfers(): Promise<{
        success: boolean;
        data: any;
    }>;
    capacity(): Promise<{
        success: boolean;
        data: any;
    }>;
    sla(): Promise<{
        success: boolean;
        data: {
            fulfillmentSlaPct: number;
            avgEtaMins: number;
            ordersDelivered7d: any;
            pickTimeMins: number;
            packTimeMins: number;
        };
    }>;
}
