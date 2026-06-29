import { PrismaService } from '../../database/prisma.service';
import { AdBudgetService } from './ad-budget.service';
export declare class KeywordAuctionService {
    private readonly prisma;
    private readonly budget;
    constructor(prisma: PrismaService, budget: AdBudgetService);
    rankForKeyword(keyword: string, maxSlots?: number): Promise<{
        sponsored: boolean;
        campaignId: string;
        auctionScore: number;
        id?: string | undefined;
        name?: string | undefined;
        storeId?: string | undefined;
        slug?: string | undefined;
        imageUrls?: string[] | undefined;
        basePrice?: import("@prisma/client/runtime/library").Decimal | undefined;
    }[]>;
}
