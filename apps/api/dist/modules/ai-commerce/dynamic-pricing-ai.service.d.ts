import { PrismaService } from '../../database/prisma.service';
export declare class DynamicPricingAIService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    runRecommendationsForStore(storeId: string): Promise<number>;
    runAllRecommendations(): Promise<number>;
    getMerchantPricing(storeIds: string[]): Promise<({
        product: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.PricingRecommendationStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        productId: string;
        currentPrice: import("@prisma/client/runtime/library").Decimal;
        recommendedPrice: import("@prisma/client/runtime/library").Decimal;
        expectedLiftPercent: number;
    })[]>;
}
