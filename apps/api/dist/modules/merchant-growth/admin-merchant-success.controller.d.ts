import { AdminMerchantSuccessService } from './admin-merchant-success.service';
export declare class AdminMerchantSuccessController {
    private readonly success;
    constructor(success: AdminMerchantSuccessService);
    overview(): Promise<{
        success: boolean;
        data: {
            summary: {
                storesTracked: any;
                avgHealthScore: number;
                atRiskCount: any;
                topPerformerCount: any;
                expansionReadyCount: any;
                fraudProneCount: any;
            };
            atRisk: any;
            topPerformers: any;
            expansionReady: any;
            fraudProne: any;
            alertsByType: any;
        };
    }>;
}
