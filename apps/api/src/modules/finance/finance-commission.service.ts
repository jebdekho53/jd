import { Injectable } from '@nestjs/common';
import { CommissionRuleScope } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { SettlementCommissionService } from '../settlement/settlement-commission.service';
import { decimalToNumber } from '../settlement/settlement.utils';

export interface CommissionResolution {
  commissionPercent: number;
  settlementDelayDays: number;
  commissionRuleId: string | null;
  ruleScope: string;
}

const DEFAULT_COMMISSION = 15;

@Injectable()
export class FinanceCommissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly legacy: SettlementCommissionService,
  ) {}

  /** Resolve commission with priority: CAMPAIGN > STORE > CATEGORY > GLOBAL > legacy SettlementConfig */
  async resolveForOrder(storeId: string, orderId: string): Promise<CommissionResolution> {
    const campaignRule = await this.findCampaignRule(storeId);
    if (campaignRule) return campaignRule;

    const storeRule = await this.prisma.commissionRule.findFirst({
      where: { scope: CommissionRuleScope.STORE, storeId, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (storeRule) {
      return {
        commissionPercent: decimalToNumber(storeRule.commissionPercent),
        settlementDelayDays: storeRule.settlementDelayDays,
        commissionRuleId: storeRule.id,
        ruleScope: 'STORE',
      };
    }

    const categoryId = await this.resolveDominantCategoryId(orderId);
    if (categoryId) {
      const categoryRule = await this.prisma.commissionRule.findFirst({
        where: { scope: CommissionRuleScope.CATEGORY, categoryId, isActive: true },
        orderBy: { updatedAt: 'desc' },
      });
      if (categoryRule) {
        return {
          commissionPercent: decimalToNumber(categoryRule.commissionPercent),
          settlementDelayDays: categoryRule.settlementDelayDays,
          commissionRuleId: categoryRule.id,
          ruleScope: 'CATEGORY',
        };
      }
    }

    const globalRule = await this.prisma.commissionRule.findFirst({
      where: { scope: CommissionRuleScope.GLOBAL, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (globalRule) {
      return {
        commissionPercent: decimalToNumber(globalRule.commissionPercent),
        settlementDelayDays: globalRule.settlementDelayDays,
        commissionRuleId: globalRule.id,
        ruleScope: 'GLOBAL',
      };
    }

    const legacy = await this.legacy.resolveForOrder(
      await this.merchantProfileIdForStore(storeId),
      orderId,
    );
    return {
      ...legacy,
      commissionRuleId: null,
      ruleScope: 'LEGACY_CONFIG',
    };
  }

  private async findCampaignRule(storeId: string): Promise<CommissionResolution | null> {
    const now = new Date();
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        storeId,
        status: 'ACTIVE',
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: { commissionRules: { where: { isActive: true }, take: 1 } },
    });
    const rule = campaign?.commissionRules[0];
    if (!rule) return null;
    return {
      commissionPercent: decimalToNumber(rule.commissionPercent),
      settlementDelayDays: rule.settlementDelayDays,
      commissionRuleId: rule.id,
      ruleScope: 'CAMPAIGN',
    };
  }

  private async merchantProfileIdForStore(storeId: string): Promise<string> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { merchantProfileId: true },
    });
    return store?.merchantProfileId ?? '';
  }

  private async resolveDominantCategoryId(orderId: string): Promise<string | null> {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
      select: { totalPrice: true, product: { select: { categoryId: true } } },
    });
    const byCategory = new Map<string, number>();
    for (const item of items) {
      const catId = item.product.categoryId;
      if (!catId) continue;
      byCategory.set(catId, (byCategory.get(catId) ?? 0) + decimalToNumber(item.totalPrice));
    }
    let dominant: string | null = null;
    let max = 0;
    for (const [catId, total] of byCategory) {
      if (total > max) {
        max = total;
        dominant = catId;
      }
    }
    return dominant;
  }
}
