import { Injectable } from '@nestjs/common';
import { SettlementConfigScope } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { decimalToNumber } from './settlement.utils';

export interface CommissionResolution {
  commissionPercent: number;
  settlementDelayDays: number;
}

const DEFAULT_COMMISSION = 15;
const DEFAULT_DELAY_DAYS = 2;

@Injectable()
export class SettlementCommissionService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveForOrder(
    merchantProfileId: string,
    orderId: string,
  ): Promise<CommissionResolution> {
    const merchantConfig = await this.prisma.settlementConfig.findFirst({
      where: {
        scope: SettlementConfigScope.MERCHANT,
        merchantProfileId,
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
    if (merchantConfig) {
      return {
        commissionPercent: decimalToNumber(merchantConfig.commissionPercent),
        settlementDelayDays: merchantConfig.settlementDelayDays,
      };
    }

    const categoryId = await this.resolveDominantCategoryId(orderId);
    if (categoryId) {
      const categoryConfig = await this.prisma.settlementConfig.findFirst({
        where: {
          scope: SettlementConfigScope.CATEGORY,
          categoryId,
          isActive: true,
        },
        orderBy: { updatedAt: 'desc' },
      });
      if (categoryConfig) {
        return {
          commissionPercent: decimalToNumber(categoryConfig.commissionPercent),
          settlementDelayDays: categoryConfig.settlementDelayDays,
        };
      }
    }

    const globalConfig = await this.prisma.settlementConfig.findFirst({
      where: { scope: SettlementConfigScope.GLOBAL, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      commissionPercent: globalConfig
        ? decimalToNumber(globalConfig.commissionPercent)
        : DEFAULT_COMMISSION,
      settlementDelayDays: globalConfig?.settlementDelayDays ?? DEFAULT_DELAY_DAYS,
    };
  }

  private async resolveDominantCategoryId(orderId: string): Promise<string | null> {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
      select: {
        totalPrice: true,
        product: { select: { categoryId: true } },
      },
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
