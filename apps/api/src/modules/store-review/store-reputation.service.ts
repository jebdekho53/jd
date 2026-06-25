import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus, Prisma, ReviewStatus, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BuyerCacheService } from '../buyer/buyer-cache.service';

export interface StoreReputationView {
  averageRating: number;
  totalReviews: number;
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
  distributionPct: Record<'1' | '2' | '3' | '4' | '5', number>;
  repeatCustomers: number;
  responseRate: number;
  rankingScore: number;
}

const REVIEWABLE_STATUSES: OrderStatus[] = [
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
];

const VISIBLE_REVIEW = { status: ReviewStatus.VISIBLE } as const;

@Injectable()
export class StoreReputationService {
  private readonly logger = new Logger(StoreReputationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly buyerCache: BuyerCacheService,
  ) {}

  async recomputeStoreReputation(storeId: string): Promise<StoreReputationView> {
    const reviews = await this.prisma.review.findMany({
      where: { storeId, ...VISIBLE_REVIEW },
      select: {
        rating: true,
        merchantReply: true,
        buyerProfileId: true,
      },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10
        : 0;

    const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } as Record<
      '1' | '2' | '3' | '4' | '5',
      number
    >;
    for (const r of reviews) {
      const key = String(Math.min(5, Math.max(1, r.rating))) as keyof typeof distribution;
      distribution[key] += 1;
    }

    const distributionPct = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } as Record<
      '1' | '2' | '3' | '4' | '5',
      number
    >;
    if (totalReviews > 0) {
      for (const k of ['1', '2', '3', '4', '5'] as const) {
        distributionPct[k] = Math.round((distribution[k] / totalReviews) * 1000) / 10;
      }
    }

    const buyerCounts = new Map<string, number>();
    for (const r of reviews) {
      buyerCounts.set(r.buyerProfileId, (buyerCounts.get(r.buyerProfileId) ?? 0) + 1);
    }
    const repeatCustomers = [...buyerCounts.values()].filter((c) => c > 1).length;

    const replied = reviews.filter((r) => Boolean(r.merchantReply?.trim())).length;
    const responseRate =
      totalReviews > 0 ? Math.round((replied / totalReviews) * 1000) / 10 : 0;

    const [fulfillmentRate, cancellationRate, avgDeliveryMins] =
      await this.computeOperationalMetrics(storeId);

    const rankingScore = this.computeRankingScore({
      averageRating,
      totalReviews,
      fulfillmentRate,
      cancellationRate,
      avgDeliveryMins,
    });

    const reputation: StoreReputationView = {
      averageRating,
      totalReviews,
      distribution,
      distributionPct,
      repeatCustomers,
      responseRate,
      rankingScore,
    };

    const store = await this.prisma.store.update({
      where: { id: storeId },
      data: {
        ratingAvg: averageRating,
        ratingCount: totalReviews,
        reputationStats: reputation as unknown as Prisma.InputJsonValue,
      },
      select: { slug: true },
    });

    await this.buyerCache.invalidateStoreCache(store.slug);
    this.logger.log(`Reputation recomputed for store ${storeId}: avg=${averageRating} count=${totalReviews}`);

    return reputation;
  }

  async getStoreReputation(storeId: string): Promise<StoreReputationView> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { reputationStats: true, ratingAvg: true, ratingCount: true },
    });
    if (!store) {
      return this.emptyReputation();
    }
    if (store.reputationStats && typeof store.reputationStats === 'object') {
      return store.reputationStats as unknown as StoreReputationView;
    }
    return this.recomputeStoreReputation(storeId);
  }

  isOrderReviewable(status: OrderStatus): boolean {
    return REVIEWABLE_STATUSES.includes(status);
  }

  private async computeOperationalMetrics(storeId: string) {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const orders = await this.prisma.order.findMany({
      where: { storeId, createdAt: { gte: since } },
      select: {
        status: true,
        delivery: { select: { estimatedMins: true, deliveredAt: true, assignedAt: true } },
      },
    });

    if (orders.length === 0) {
      return [1, 0, 30] as const;
    }

    const fulfilled = orders.filter(
      (o) => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.COMPLETED,
    ).length;
    const cancelled = orders.filter((o) =>
      String(o.status).startsWith('CANCELLED'),
    ).length;

    const fulfillmentRate = fulfilled / orders.length;
    const cancellationRate = cancelled / orders.length;

    const deliveryMins = orders
      .map((o) => o.delivery?.estimatedMins)
      .filter((m): m is number => m != null && m > 0);
    const avgDeliveryMins =
      deliveryMins.length > 0
        ? deliveryMins.reduce((a, b) => a + b, 0) / deliveryMins.length
        : 30;

    return [fulfillmentRate, cancellationRate, avgDeliveryMins] as const;
  }

  computeRankingScore(input: {
    averageRating: number;
    totalReviews: number;
    fulfillmentRate: number;
    cancellationRate: number;
    avgDeliveryMins: number;
  }): number {
    const ratingComponent = input.averageRating * 20;
    const volumeComponent = Math.min(20, Math.log10(input.totalReviews + 1) * 10);
    const fulfillmentComponent = input.fulfillmentRate * 30;
    const cancellationPenalty = input.cancellationRate * 25;
    const speedComponent = Math.max(0, 15 - input.avgDeliveryMins / 10);
    return Math.round(
      (ratingComponent + volumeComponent + fulfillmentComponent + speedComponent - cancellationPenalty) *
        10,
    ) / 10;
  }

  private emptyReputation(): StoreReputationView {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
      distributionPct: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
      repeatCustomers: 0,
      responseRate: 0,
      rankingScore: 0,
    };
  }
}
