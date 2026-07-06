import { PrismaService } from '../../database/prisma.service';
export declare class ProcurementAnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMerchantAnalytics(merchantProfileId: string, storeId?: string): Promise<{
        totalSpend: any;
        orderCount: any;
        fulfillmentRate: number;
        vendorComparison: {
            name: string;
            spend: number;
            orders: number;
        }[];
        procurementSavings: number;
        inventoryTurnover: number;
        marginAnalysis: {
            avgMarginPct: number;
        };
    }>;
}
