import { AdminMerchantSuccessService } from './admin-merchant-success.service';
export declare class AdminMerchantSuccessController {
    private readonly success;
    constructor(success: AdminMerchantSuccessService);
    overview(): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
}
