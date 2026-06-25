import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DynamicPricingAIService {
  private readonly logger = new Logger(DynamicPricingAIService.name);

  constructor(private readonly prisma: PrismaService) {}

  async runRecommendationsForStore(storeId: string) {
    const products = await this.prisma.product.findMany({
      where: { storeId, isActive: true, deletedAt: null },
      select: { id: true, basePrice: true, name: true },
      take: 50,
    });

    let count = 0;
    for (const product of products) {
      const currentPrice = Number(product.basePrice);
      const forecast = await this.prisma.demandForecast.findFirst({
        where: { storeId, productId: product.id },
        orderBy: { forecastDate: 'asc' },
      });

      const demandTrend = forecast ? forecast.predictedDemand / Math.max(1, forecast.actualDemand ?? forecast.predictedDemand) : 1;
      let recommendedPrice = currentPrice;
      let expectedLiftPercent = 0;

      if (demandTrend > 1.2) {
        recommendedPrice = round(currentPrice * 1.05);
        expectedLiftPercent = -2;
      } else if (demandTrend < 0.8) {
        recommendedPrice = round(currentPrice * 0.92);
        expectedLiftPercent = 12;
      }

      if (recommendedPrice === currentPrice) continue;

      const existing = await this.prisma.pricingRecommendation.findFirst({
        where: { storeId, productId: product.id, status: 'PENDING' },
      });
      if (existing) {
        await this.prisma.pricingRecommendation.update({
          where: { id: existing.id },
          data: { currentPrice, recommendedPrice, expectedLiftPercent },
        });
      } else {
        await this.prisma.pricingRecommendation.create({
          data: {
            storeId,
            productId: product.id,
            currentPrice,
            recommendedPrice,
            expectedLiftPercent,
          },
        });
      }
      count++;
    }

    this.logger.log(`Generated ${count} pricing recommendations for store ${storeId}`);
    return count;
  }

  async runAllRecommendations() {
    const stores = await this.prisma.store.findMany({
      where: { isActive: true, status: 'APPROVED' },
      select: { id: true },
      take: 50,
    });
    let total = 0;
    for (const s of stores) total += await this.runRecommendationsForStore(s.id);
    return total;
  }

  async getMerchantPricing(storeIds: string[]) {
    return this.prisma.pricingRecommendation.findMany({
      where: { storeId: { in: storeIds }, status: 'PENDING' },
      include: { product: { select: { id: true, name: true } } },
      take: 30,
    });
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
