import { PrismaService } from '../../database/prisma.service';
export interface RebalanceSuggestion {
    id: string;
    fromStoreId: string;
    fromStoreName: string;
    toStoreId: string;
    toStoreName: string;
    sku: string;
    suggestedQty: number;
    reason: string;
    expectedUpliftPct: number;
}
export declare class RebalancingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getSuggestions(merchantProfileId: string): Promise<RebalanceSuggestion[]>;
    private findOverstockSource;
}
