import { PrismaService } from '../../database/prisma.service';
export declare class AdminSupplyChainService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboard(): Promise<{
        activeVendors: any;
        activeOrders: any;
        pendingSettlements: any;
        inventoryShortages: any;
        topVendors: any;
        creditRisk: any;
    }>;
    listVendors(): Promise<any>;
    listVendorOrders(): Promise<any>;
    listVendorSettlements(): Promise<any>;
}
