import { Injectable } from '@nestjs/common';
import { AIRecommendationEntityType, AIRecommendationPriority } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AIRecommendationService {
  constructor(private readonly prisma: PrismaService) {}

  async generateForStore(storeId: string) {
    const forecasts = await this.prisma.demandForecast.findMany({
      where: { storeId },
      include: { product: { select: { name: true } } },
      orderBy: { predictedDemand: 'desc' },
      take: 5,
    });

    for (const f of forecasts) {
      if (f.predictedDemand < 5) continue;
      const title = `Increase ${f.product.name} stock`;
      const description = `Demand expected +${Math.round(f.confidenceScore * 0.4)}%`;
      await this.upsertRecommendation('PRODUCT', f.productId, title, description, 'HIGH');
    }

    const pricing = await this.prisma.pricingRecommendation.findMany({
      where: { storeId, status: 'PENDING' },
      include: { product: { select: { name: true } } },
      take: 3,
    });
    for (const p of pricing) {
      if (Number(p.recommendedPrice) < Number(p.currentPrice)) {
        await this.upsertRecommendation(
          'PRODUCT',
          p.productId,
          `Launch offer on ${p.product.name}`,
          'Competitor pricing lower — recommended discount',
          'MEDIUM',
        );
      }
    }
  }

  async generateAll() {
    const stores = await this.prisma.store.findMany({
      where: { isActive: true },
      select: { id: true },
      take: 50,
    });
    for (const s of stores) await this.generateForStore(s.id);
  }

  async getForMerchant(storeIds: string[]) {
    return this.prisma.aIRecommendation.findMany({
      where: {
        OR: storeIds.flatMap((id) => [
          { entityType: 'STORE', entityId: id },
          { entityType: 'MERCHANT', entityId: id },
        ]),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 30,
    });
  }

  async getAdminRecommendations() {
    return this.prisma.aIRecommendation.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
  }

  private async upsertRecommendation(
    entityType: AIRecommendationEntityType,
    entityId: string,
    title: string,
    description: string,
    priority: AIRecommendationPriority,
  ) {
    const existing = await this.prisma.aIRecommendation.findFirst({
      where: { entityType, entityId, title },
    });
    if (existing) {
      await this.prisma.aIRecommendation.update({
        where: { id: existing.id },
        data: { description, priority },
      });
    } else {
      await this.prisma.aIRecommendation.create({
        data: { entityType, entityId, title, description, priority },
      });
    }
  }
}
