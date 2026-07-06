import { PrismaService } from '../../database/prisma.service';
export declare class DemandForecastService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    runForecastsForStore(storeId: string): Promise<number>;
    runAllForecasts(): Promise<number>;
    getMerchantForecasts(storeIds: string[]): Promise<any>;
    getAdminForecasts(): Promise<any>;
    getForecastAccuracy(): Promise<{
        accuracyPct: number;
        samples: any;
    }>;
    private orderQty;
    private campaignBoost;
}
