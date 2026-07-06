import { PrismaService } from '../../database/prisma.service';
import { SettlementCommissionService } from '../settlement/settlement-commission.service';
import { CreateCommissionRuleDto, UpdateCommissionRuleDto } from './dto/commission-rule.dto';
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
    readonly defaultCommissionPercent = 15;
    listRules(): Promise<{
        defaultCommissionPercent: number;
        rules: any;
    }>;
    createRule(dto: CreateCommissionRuleDto): Promise<{
        id: any;
    }>;
    updateRule(id: string, dto: UpdateCommissionRuleDto): Promise<{
        id: string;
    }>;
    deleteRule(id: string): Promise<{
        id: string;
    }>;
    private assertScopeTarget;
    resolveForOrder(storeId: string, orderId: string): Promise<CommissionResolution>;
    private findCampaignRule;
    private merchantProfileIdForStore;
    private resolveDominantCategoryId;
}
