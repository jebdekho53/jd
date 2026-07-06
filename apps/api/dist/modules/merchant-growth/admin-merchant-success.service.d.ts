import { PrismaService } from '../../database/prisma.service';
export declare class AdminMerchantSuccessService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboard(): Promise<{
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
    }>;
    private mapRow;
}
