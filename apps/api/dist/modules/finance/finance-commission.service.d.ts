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
        rules: {
            id: string;
            scope: import("@prisma/client").$Enums.CommissionRuleScope;
            storeId: string | null;
            storeName: string | null;
            categoryId: string | null;
            categoryName: string | null;
            commissionPercent: number;
            settlementDelayDays: number;
            isActive: boolean;
            updatedAt: Date;
        }[];
    }>;
    createRule(dto: CreateCommissionRuleDto): Promise<{
        id: string;
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
