import { PrismaService } from '../../database/prisma.service';
export declare class PurchaseRecommendationService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    generateForMerchant(merchantProfileId: string, storeId?: string): Promise<{
        suggestedVendorName: string | undefined;
        id: string;
        createdAt: Date;
        storeId: string | null;
        alertType: import("@prisma/client").$Enums.ProcurementAlertType;
        merchantProfileId: string;
        productName: string;
        sku: string;
        recommendedQty: number;
        vendorProductId: string | null;
        currentStock: number;
        avgDailySales: number;
        predictedOosDays: number;
        suggestedVendorId: string | null;
        expectedRevenueImpact: import("@prisma/client/runtime/library").Decimal;
        isDismissed: boolean;
    }[]>;
    listRecommendations(merchantProfileId: string, storeId?: string): Promise<{
        id: string;
        createdAt: Date;
        storeId: string | null;
        alertType: import("@prisma/client").$Enums.ProcurementAlertType;
        merchantProfileId: string;
        productName: string;
        sku: string;
        recommendedQty: number;
        vendorProductId: string | null;
        currentStock: number;
        avgDailySales: number;
        predictedOosDays: number;
        suggestedVendorId: string | null;
        expectedRevenueImpact: import("@prisma/client/runtime/library").Decimal;
        isDismissed: boolean;
    }[]>;
    private resolveAlertType;
}
