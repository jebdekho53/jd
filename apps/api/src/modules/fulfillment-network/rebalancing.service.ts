import { Injectable } from '@nestjs/common';
import { FulfillmentAuditAction, InventoryTransferStatus, OrderStatus, Prisma, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BUYER_STATUS_GROUPS } from '../order/order-status-groups';

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

@Injectable()
export class RebalancingService {
  constructor(private readonly prisma: PrismaService) {}

  async getSuggestions(merchantProfileId: string): Promise<RebalanceSuggestion[]> {
    const stores = await this.prisma.store.findMany({
      where: {
        merchantProfileId,
        status: StoreStatus.APPROVED,
        isActive: true,
        deletedAt: null,
      },
      select: { id: true, name: true },
    });
    if (stores.length < 2) return [];

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const suggestions: RebalanceSuggestion[] = [];

    for (const store of stores) {
      const lowStockVariants = await this.prisma.productVariant.findMany({
        where: {
          product: { storeId: store.id, isActive: true },
          inventory: { availableQty: { lte: 5 } },
        },
        select: { sku: true, inventory: { select: { availableQty: true } } },
        take: 10,
      });

      for (const v of lowStockVariants) {
        const demand = await this.prisma.orderItem.count({
          where: {
            sku: v.sku,
            order: {
              storeId: store.id,
              createdAt: { gte: sevenDaysAgo },
              status: { notIn: [...BUYER_STATUS_GROUPS.cancelled] },
            },
          },
        });
        if (demand < 3) continue;

        const overstock = await this.findOverstockSource(merchantProfileId, store.id, v.sku);
        if (!overstock) continue;

        const suggestedQty = Math.min(20, Math.max(5, demand));
        suggestions.push({
          id: `${store.id}-${overstock.storeId}-${v.sku}`,
          fromStoreId: overstock.storeId,
          fromStoreName: overstock.storeName,
          toStoreId: store.id,
          toStoreName: store.name,
          sku: v.sku,
          suggestedQty,
          reason: `High demand (${demand} orders/7d) with low stock at ${store.name}`,
          expectedUpliftPct: Math.min(30, Math.round(demand * 3)),
        });
      }
    }

    if (suggestions.length > 0) {
      await this.prisma.fulfillmentAudit.create({
        data: {
          action: FulfillmentAuditAction.REBALANCE_SUGGESTED,
          metadata: { count: suggestions.length } as Prisma.InputJsonValue,
        },
      });
    }

    return suggestions.slice(0, 10);
  }

  private async findOverstockSource(merchantProfileId: string, excludeStoreId: string, sku: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        sku,
        product: {
          store: { merchantProfileId, id: { not: excludeStoreId }, isActive: true },
        },
        inventory: { availableQty: { gte: 15 } },
      },
      include: { product: { include: { store: { select: { id: true, name: true } } } } },
    });
    if (!variant) return null;
    return { storeId: variant.product.store.id, storeName: variant.product.store.name };
  }
}
