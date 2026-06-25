import { Injectable, Logger } from '@nestjs/common';
import { ProcurementAlertType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BUYER_STATUS_GROUPS } from '../order/order-status-groups';

@Injectable()
export class PurchaseRecommendationService {
  private readonly logger = new Logger(PurchaseRecommendationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateForMerchant(merchantProfileId: string, storeId?: string) {
    const stores = storeId
      ? await this.prisma.store.findMany({ where: { id: storeId, merchantProfileId } })
      : await this.prisma.store.findMany({ where: { merchantProfileId, isActive: true, deletedAt: null } });

    const recommendations = [];
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    for (const store of stores) {
      const variants = await this.prisma.productVariant.findMany({
        where: { product: { storeId: store.id, isActive: true }, isActive: true },
        include: { inventory: true, product: { select: { name: true } } },
        take: 50,
      });

      for (const variant of variants) {
        const stock = variant.inventory?.availableQty ?? 0;
        const sales = await this.prisma.orderItem.aggregate({
          where: {
            variantId: variant.id,
            order: {
              storeId: store.id,
              createdAt: { gte: fourteenDaysAgo },
              status: { notIn: [...BUYER_STATUS_GROUPS.cancelled] },
            },
          },
          _sum: { quantity: true },
        });
        const totalSold = sales._sum.quantity ?? 0;
        const avgDaily = totalSold / 14;
        if (avgDaily < 0.5 && stock > 10) continue;

        const predictedOos = avgDaily > 0 ? stock / avgDaily : 999;
        if (predictedOos > 7 && stock > 5) continue;

        const alertType = this.resolveAlertType(stock, avgDaily, predictedOos);
        const recommendedQty = Math.max(variant.product ? 20 : 10, Math.ceil(avgDaily * 14));

        const vendorProduct = await this.prisma.vendorProduct.findFirst({
          where: { sku: variant.sku, isActive: true, inventory: { availableQty: { gte: recommendedQty } } },
          include: { vendor: { select: { id: true, businessName: true } } },
          orderBy: { basePrice: 'asc' },
        });

        const unitPrice = Number(variant.price);
        const expectedImpact = recommendedQty * unitPrice * 0.3;

        const rec = await this.prisma.purchaseRecommendation.upsert({
          where: {
            id: `${merchantProfileId}-${store.id}-${variant.sku}`,
          },
          create: {
            id: `${merchantProfileId}-${store.id}-${variant.sku}`,
            merchantProfileId,
            storeId: store.id,
            vendorProductId: vendorProduct?.id,
            sku: variant.sku,
            productName: variant.product.name,
            currentStock: stock,
            avgDailySales: avgDaily,
            predictedOosDays: predictedOos,
            recommendedQty,
            suggestedVendorId: vendorProduct?.vendor.id,
            expectedRevenueImpact: expectedImpact,
            alertType,
          },
          update: {
            currentStock: stock,
            avgDailySales: avgDaily,
            predictedOosDays: predictedOos,
            recommendedQty,
            vendorProductId: vendorProduct?.id,
            suggestedVendorId: vendorProduct?.vendor.id,
            expectedRevenueImpact: expectedImpact,
            alertType,
            isDismissed: false,
          },
        });
        recommendations.push({
          ...rec,
          suggestedVendorName: vendorProduct?.vendor.businessName,
        });
      }
    }

    return recommendations;
  }

  async listRecommendations(merchantProfileId: string, storeId?: string) {
    await this.generateForMerchant(merchantProfileId, storeId);
    return this.prisma.purchaseRecommendation.findMany({
      where: { merchantProfileId, isDismissed: false, ...(storeId ? { storeId } : {}) },
      orderBy: { predictedOosDays: 'asc' },
      take: 20,
    });
  }

  private resolveAlertType(stock: number, avgDaily: number, predictedOos: number): ProcurementAlertType {
    if (stock === 0) return ProcurementAlertType.OUT_OF_STOCK_RISK;
    if (predictedOos <= 2) return ProcurementAlertType.LOW_STOCK_REPLENISH;
    if (avgDaily >= 5) return ProcurementAlertType.FAST_MOVING_SKU;
    if (avgDaily >= 3) return ProcurementAlertType.HIGH_DEMAND_ALERT;
    return ProcurementAlertType.SEASONAL_DEMAND_ALERT;
  }
}
