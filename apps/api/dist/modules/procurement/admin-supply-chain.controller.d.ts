import { AdminSupplyChainService } from './admin-supply-chain.service';
export declare class AdminSupplyChainController {
    private readonly supplyChain;
    constructor(supplyChain: AdminSupplyChainService);
    dashboard(): Promise<{
        success: boolean;
        data: {
            activeVendors: any;
            activeOrders: any;
            pendingSettlements: any;
            inventoryShortages: any;
            topVendors: any;
            creditRisk: any;
        };
    }>;
    vendors(): Promise<{
        success: boolean;
        data: any;
    }>;
    vendorOrders(): Promise<{
        success: boolean;
        data: any;
    }>;
    vendorSettlements(): Promise<{
        success: boolean;
        data: any;
    }>;
}
