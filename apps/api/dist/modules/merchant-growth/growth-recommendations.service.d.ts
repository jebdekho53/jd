import { PrismaService } from '../../database/prisma.service';
import type { StoreHealthResult } from './store-health.service';
export interface GrowthAction {
    id: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    expectedImpact?: string;
    cta?: string;
}
export interface GrowthRecommendation {
    type: string;
    title: string;
    detail: string;
    impact?: string;
}
export declare class GrowthRecommendationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    buildActionCenter(storeId: string, health: StoreHealthResult, context: {
        productCount: number;
        lowStockSkus: number;
        lostSearches: Array<{
            query: string;
            count: number;
        }>;
        hiddenLocalities?: string[];
    }): GrowthAction[];
    buildRecommendations(storeId: string, health: StoreHealthResult, search: {
        lostSearches: Array<{
            query: string;
            count: number;
        }>;
        topSearchedProducts: Array<{
            query: string;
            count: number;
        }>;
    }): Promise<GrowthRecommendation[]>;
}
