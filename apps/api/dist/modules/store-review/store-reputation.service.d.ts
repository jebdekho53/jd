import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BuyerCacheService } from '../buyer/buyer-cache.service';
export interface StoreReputationView {
    averageRating: number;
    totalReviews: number;
    distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
    distributionPct: Record<'1' | '2' | '3' | '4' | '5', number>;
    repeatCustomers: number;
    responseRate: number;
    rankingScore: number;
}
export declare class StoreReputationService {
    private readonly prisma;
    private readonly buyerCache;
    private readonly logger;
    constructor(prisma: PrismaService, buyerCache: BuyerCacheService);
    recomputeStoreReputation(storeId: string): Promise<StoreReputationView>;
    getStoreReputation(storeId: string): Promise<StoreReputationView>;
    isOrderReviewable(status: OrderStatus): boolean;
    private computeOperationalMetrics;
    computeRankingScore(input: {
        averageRating: number;
        totalReviews: number;
        fulfillmentRate: number;
        cancellationRate: number;
        avgDeliveryMins: number;
    }): number;
    private emptyReputation;
}
