import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { predictStockout } from './inventory-forecast.util';

@Injectable()
export class InventoryForecastService {
  private readonly logger = new Logger(InventoryForecastService.name);

  constructor(private readonly prisma: PrismaService) {}

  async runForecastsForStore(storeId: string) {
    const products = await this.prisma.product.findMany({
      where: { storeId, isActive: true, deletedAt: null },
      include: {
        variants: {
          include: { inventory: true },
          where: { isDefault: true },
          take: 1,
        },
      },
      take: 100,
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let count = 0;

    for (const product of products) {
      const inv = product.variants[0]?.inventory;
      const availableQty = inv?.availableQty ?? 0;
      const soldQty30d = inv?.soldQty ?? 0;

      const result = predictStockout({
        availableQty,
        soldQty30d,
        leadTimeDays: 2,
      });

      await this.prisma.inventoryForecast.upsert({
        where: { storeId_productId: { storeId, productId: product.id } },
        update: {
          daysUntilStockout: result.daysUntilStockout,
          recommendedQty: result.recommendedQty,
          urgency: result.urgency,
        },
        create: {
          storeId,
          productId: product.id,
          daysUntilStockout: result.daysUntilStockout,
          recommendedQty: result.recommendedQty,
          urgency: result.urgency,
        },
      });
      count++;
    }

    this.logger.log(`Generated ${count} inventory forecasts for store ${storeId}`);
    return count;
  }

  async runAllForecasts() {
    const stores = await this.prisma.store.findMany({
      where: { isActive: true, status: 'APPROVED' },
      select: { id: true },
      take: 50,
    });
    let total = 0;
    for (const s of stores) total += await this.runForecastsForStore(s.id);
    return total;
  }

  async getMerchantInventory(storeIds: string[]) {
    return this.prisma.inventoryForecast.findMany({
      where: { storeId: { in: storeIds } },
      include: { product: { select: { id: true, name: true } } },
      orderBy: [{ urgency: 'desc' }, { daysUntilStockout: 'asc' }],
      take: 50,
    });
  }

  async getInventoryCrises() {
    return this.prisma.inventoryForecast.findMany({
      where: { urgency: { in: ['HIGH', 'CRITICAL'] } },
      include: {
        store: { select: { name: true } },
        product: { select: { name: true } },
      },
      take: 30,
    });
  }
}
