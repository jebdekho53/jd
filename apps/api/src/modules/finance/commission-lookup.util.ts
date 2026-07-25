import { CommissionRuleScope } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { decimalToNumber } from '../settlement/settlement.utils';

/** Platform-wide default used when no CATEGORY or GLOBAL rule matches. */
export const DEFAULT_COMMISSION_PERCENT = 15;

/**
 * Effective commission % per categoryId — the CATEGORY rule if one is active,
 * else the active GLOBAL rule, else the hardcoded platform default. Display
 * only (category browse/apply tree, product-add forms); order-time
 * resolution still goes through FinanceCommissionService.resolveForOrder().
 *
 * Plain function (not a NestJS provider) so callers outside the finance
 * module graph — e.g. category-governance, which FinanceModule's own
 * settlement/payment imports already cycle back through — can use it without
 * importing FinanceModule and re-creating that cycle.
 */
export async function getEffectiveCategoryCommissionMap(
  prisma: PrismaService,
  categoryIds: string[],
): Promise<Map<string, number>> {
  const uniqueIds = [...new Set(categoryIds)];
  const [categoryRules, globalRule] = await Promise.all([
    uniqueIds.length
      ? prisma.commissionRule.findMany({
          where: { scope: CommissionRuleScope.CATEGORY, categoryId: { in: uniqueIds }, isActive: true },
          orderBy: { updatedAt: 'desc' },
        })
      : Promise.resolve([]),
    prisma.commissionRule.findFirst({
      where: { scope: CommissionRuleScope.GLOBAL, isActive: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);
  const globalPercent = globalRule ? decimalToNumber(globalRule.commissionPercent) : DEFAULT_COMMISSION_PERCENT;
  const byCategory = new Map<string, number>();
  for (const rule of categoryRules) {
    if (rule.categoryId && !byCategory.has(rule.categoryId)) {
      byCategory.set(rule.categoryId, decimalToNumber(rule.commissionPercent));
    }
  }
  const result = new Map<string, number>();
  for (const id of uniqueIds) {
    result.set(id, byCategory.get(id) ?? globalPercent);
  }
  return result;
}
