import { PrismaService } from '../../database/prisma.service';
import { AdBudgetService } from './ad-budget.service';
export declare class KeywordAuctionService {
    private readonly prisma;
    private readonly budget;
    constructor(prisma: PrismaService, budget: AdBudgetService);
    rankForKeyword(keyword: string, maxSlots?: number): Promise<any[]>;
}
