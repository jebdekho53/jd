import { PrismaService } from '../../database/prisma.service';
export declare class DemandForecastService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    runForecastsForStore(storeId: string): Promise<number>;
    runAllForecasts(): Promise<number>;
    getMerchantForecasts(storeIds: string[]): Promise<({
        product: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        productId: string;
        forecastDate: Date;
        predictedDemand: number;
        confidenceScore: number;
        actualDemand: number | null;
    })[]>;
    getAdminForecasts(): Promise<({
        store: {
            name: string;
        };
        product: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        productId: string;
        forecastDate: Date;
        predictedDemand: number;
        confidenceScore: number;
        actualDemand: number | null;
    })[]>;
    getForecastAccuracy(): Promise<{
        accuracyPct: number;
        samples: number;
    }>;
    private orderQty;
    private campaignBoost;
}
