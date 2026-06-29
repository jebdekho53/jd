import { PrismaService } from '../../database/prisma.service';
import { SettlementCommissionService } from '../settlement/settlement-commission.service';
export interface CommissionResolution {
    commissionPercent: number;
    settlementDelayDays: number;
    commissionRuleId: string | null;
    ruleScope: string;
}
export declare class FinanceCommissionService {
    private readonly prisma;
    private readonly legacy;
    constructor(prisma: PrismaService, legacy: SettlementCommissionService);
    resolveForOrder(storeId: string, orderId: string): Promise<CommissionResolution>;
    private findCampaignRule;
    private merchantProfileIdForStore;
    private resolveDominantCategoryId;
}
