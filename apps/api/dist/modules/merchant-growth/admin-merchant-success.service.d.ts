import { PrismaService } from '../../database/prisma.service';
export declare class AdminMerchantSuccessService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboard(): Promise<{
        summary: {
            storesTracked: number;
            avgHealthScore: number;
            atRiskCount: number;
            topPerformerCount: number;
            expansionReadyCount: number;
            fraudProneCount: number;
        };
        atRisk: {
            storeId: string;
            storeName: string;
            merchantName: string;
            phone: string;
            healthScore: number;
            visibilityScore: number;
        }[];
        topPerformers: {
            storeId: string;
            storeName: string;
            merchantName: string;
            phone: string;
            healthScore: number;
            visibilityScore: number;
        }[];
        expansionReady: {
            storeId: string;
            storeName: string;
            merchantName: string;
            phone: string;
            healthScore: number;
            visibilityScore: number;
        }[];
        fraudProne: {
            storeId: string;
            storeName: string;
            merchantName: string;
            phone: string;
            healthScore: number;
            visibilityScore: number;
        }[];
        alertsByType: {
            type: import("@prisma/client").$Enums.MerchantGrowthAlertType;
            count: number;
        }[];
    }>;
    private mapRow;
}
