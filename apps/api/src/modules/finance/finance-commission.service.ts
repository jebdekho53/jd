import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommissionRuleScope, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { SettlementCommissionService } from '../settlement/settlement-commission.service';
import { decimalToNumber } from '../settlement/settlement.utils';
import {
  CreateCommissionRuleDto,
  UpdateCommissionRuleDto,
} from './dto/commission-rule.dto';

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

  /** The platform-wide default used when no rule matches. */
  readonly defaultCommissionPercent = DEFAULT_COMMISSION;

  // ── Admin: manage commission rules ─────────────────────────────────────────

  async listRules() {
    const rules = await this.prisma.commissionRule.findMany({
      orderBy: [{ scope: 'asc' }, { updatedAt: 'desc' }],
      include: {
        store: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });
    return {
      defaultCommissionPercent: DEFAULT_COMMISSION,
      rules: rules.map((r) => ({
        id: r.id,
        scope: r.scope,
        storeId: r.storeId,
        storeName: r.store?.name ?? null,
        categoryId: r.categoryId,
        categoryName: r.category?.name ?? null,
        commissionPercent: decimalToNumber(r.commissionPercent),
        settlementDelayDays: r.settlementDelayDays,
        isActive: r.isActive,
        updatedAt: r.updatedAt,
      })),
    };
  }

  async createRule(dto: CreateCommissionRuleDto) {
    this.assertScopeTarget(dto.scope, dto.storeId, dto.categoryId);

    if (dto.scope === CommissionRuleScope.STORE && dto.storeId) {
      const store = await this.prisma.store.findUnique({ where: { id: dto.storeId }, select: { id: true } });
      if (!store) throw new NotFoundException('Store not found');
    }
    if (dto.scope === CommissionRuleScope.CATEGORY && dto.categoryId) {
      const cat = await this.prisma.category.findUnique({ where: { id: dto.categoryId }, select: { id: true } });
      if (!cat) throw new NotFoundException('Category not found');
    }

    const created = await this.prisma.commissionRule.create({
      data: {
        scope: dto.scope,
        storeId: dto.scope === CommissionRuleScope.STORE ? dto.storeId : null,
        categoryId: dto.scope === CommissionRuleScope.CATEGORY ? dto.categoryId : null,
        commissionPercent: new Prisma.Decimal(dto.commissionPercent),
        settlementDelayDays: dto.settlementDelayDays ?? 2,
        isActive: dto.isActive ?? true,
      },
    });
    return { id: created.id };
  }

  async updateRule(id: string, dto: UpdateCommissionRuleDto) {
    const existing = await this.prisma.commissionRule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Commission rule not found');
    await this.prisma.commissionRule.update({
      where: { id },
      data: {
        ...(dto.commissionPercent !== undefined && {
          commissionPercent: new Prisma.Decimal(dto.commissionPercent),
        }),
        ...(dto.settlementDelayDays !== undefined && { settlementDelayDays: dto.settlementDelayDays }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    return { id };
  }

  async deleteRule(id: string) {
    const existing = await this.prisma.commissionRule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Commission rule not found');
    await this.prisma.commissionRule.delete({ where: { id } });
    return { id };
  }

  private assertScopeTarget(scope: CommissionRuleScope, storeId?: string, categoryId?: string): void {
    if (scope === CommissionRuleScope.STORE && !storeId) {
      throw new BadRequestException('storeId is required for a STORE-scoped rule');
    }
    if (scope === CommissionRuleScope.CATEGORY && !categoryId) {
      throw new BadRequestException('categoryId is required for a CATEGORY-scoped rule');
    }
    if (scope === CommissionRuleScope.CAMPAIGN) {
      throw new BadRequestException('CAMPAIGN rules are managed via campaigns, not here');
    }
  }

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
