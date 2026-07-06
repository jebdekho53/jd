import { PrismaService } from '../../database/prisma.service';
export declare class DynamicPricingAIService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    runRecommendationsForStore(storeId: string): Promise<number>;
    runAllRecommendations(): Promise<number>;
    getMerchantPricing(storeIds: string[]): Promise<any>;
}
