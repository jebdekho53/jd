import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { startOfIstDay } from '../../common/utils/ist-day.util';
import { predictDemand } from './demand-forecast.util';
import { BUYER_STATUS_GROUPS } from '../order/order-status-groups';

@Injectable()
export class DemandForecastService {
  private readonly logger = new Logger(DemandForecastService.name);

  constructor(private readonly prisma: PrismaService) {}

  async runForecastsForStore(storeId: string) {
    const products = await this.prisma.product.findMany({
      where: { storeId, isActive: true, deletedAt: null },
      select: { id: true },
      take: 100,
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let count = 0;
    for (const product of products) {
      for (const horizon of [1, 7]) {
        const forecastDate = new Date(startOfIstDay(now).getTime() + horizon * 24 * 60 * 60 * 1000);

        const [orderQty7d, orderQty30d, searchHits7d, cartAdds7d, campaignBoost] = await Promise.all([
          this.orderQty(storeId, product.id, sevenDaysAgo),
          this.orderQty(storeId, product.id, thirtyDaysAgo),
          this.prisma.searchEvent.count({
            where: { createdAt: { gte: sevenDaysAgo }, productId: product.id },
          }),
          this.prisma.cartItem.count({
            where: { productId: product.id, cart: { storeId }, createdAt: { gte: sevenDaysAgo } },
          }),
          this.campaignBoost(storeId),
        ]);

        const result = predictDemand(
          { orderQty7d, orderQty30d, searchHits7d, cartAdds7d, campaignBoost },
          horizon,
        );

        await this.prisma.demandForecast.upsert({
          where: {
            storeId_productId_forecastDate: {
              storeId,
              productId: product.id,
              forecastDate,
            },
          },
          update: {
            predictedDemand: result.predictedDemand,
            confidenceScore: result.confidenceScore,
          },
          create: {
            storeId,
            productId: product.id,
            forecastDate,
            predictedDemand: result.predictedDemand,
            confidenceScore: result.confidenceScore,
          },
        });
        count++;
      }
    }
    this.logger.log(`Generated ${count} demand forecasts for store ${storeId}`);
    return count;
  }

  async runAllForecasts() {
    const stores = await this.prisma.store.findMany({
      where: { isActive: true, status: 'APPROVED' },
      select: { id: true },
      take: 50,
    });
    let total = 0;
    for (const s of stores) {
      total += await this.runForecastsForStore(s.id);
    }
    return total;
  }

  async getMerchantForecasts(storeIds: string[]) {
    const tomorrow = new Date(startOfIstDay().getTime() + 24 * 60 * 60 * 1000);
    const week = new Date(startOfIstDay().getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.demandForecast.findMany({
      where: { storeId: { in: storeIds }, forecastDate: { in: [tomorrow, week] } },
      include: { product: { select: { id: true, name: true } } },
      orderBy: { predictedDemand: 'desc' },
      take: 50,
    });
  }

  async getAdminForecasts() {
    return this.prisma.demandForecast.findMany({
      include: {
        store: { select: { name: true } },
        product: { select: { name: true } },
      },
      orderBy: { forecastDate: 'asc' },
      take: 100,
    });
  }

  async getForecastAccuracy() {
    const rows = await this.prisma.demandForecast.findMany({
      where: { actualDemand: { not: null } },
      take: 200,
    });
    if (rows.length === 0) return { accuracyPct: 0, samples: 0 };
    const errors = rows.map((r) => {
      const actual = r.actualDemand ?? 0;
      const predicted = r.predictedDemand;
      return actual > 0 ? Math.abs(actual - predicted) / actual : predicted > 0 ? 1 : 0;
    });
    const mape = errors.reduce((s, e) => s + e, 0) / errors.length;
    return { accuracyPct: Math.round((1 - mape) * 100), samples: rows.length };
  }

  private async orderQty(storeId: string, productId: string, since: Date) {
    const agg = await this.prisma.orderItem.aggregate({
      where: {
        productId,
        order: {
          storeId,
          createdAt: { gte: since },
          status: { notIn: [...BUYER_STATUS_GROUPS.cancelled] },
        },
      },
      _sum: { quantity: true },
    });
    return agg._sum.quantity ?? 0;
  }

  private async campaignBoost(storeId: string) {
    const active = await this.prisma.storePromotion.count({
      where: { storeId, isActive: true, expiresAt: { gte: new Date() } },
    });
    return Math.min(0.3, active * 0.05);
  }
}
