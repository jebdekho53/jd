import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RecommendationService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecommendations(userId: string, entityType: 'product' | 'store' | 'offer' | 'category', limit = 10) {
    const cached = await this.prisma.recommendationScore.findMany({
      where: { userId, entityType },
      orderBy: { score: 'desc' },
      take: limit,
    });
    if (cached.length >= limit) return cached;

    const affinities = await this.prisma.customerAffinity.findMany({
      where: { userId },
      orderBy: { score: 'desc' },
      take: 50,
    });

    const scores: Array<{ entityType: string; entityId: string; score: number; reason: string }> = [];

    for (const aff of affinities) {
      if (entityType === 'product' && aff.entityType === 'product') {
        scores.push({ entityType: 'product', entityId: aff.entityId, score: aff.score, reason: 'affinity' });
      }
      if (entityType === 'store' && aff.entityType === 'store') {
        scores.push({ entityType: 'store', entityId: aff.entityId, score: aff.score, reason: 'affinity' });
      }
    }

    if (entityType === 'product' && scores.length < limit) {
      const popular = await this.prisma.orderItem.groupBy({
        by: ['productId'],
        _count: true,
        orderBy: { _count: { productId: 'desc' } },
        take: limit,
      });
      for (const p of popular) {
        scores.push({ entityType: 'product', entityId: p.productId, score: p._count, reason: 'popular' });
      }
    }

    const unique = new Map<string, (typeof scores)[0]>();
    for (const s of scores) {
      const key = `${s.entityType}:${s.entityId}`;
      if (!unique.has(key) || unique.get(key)!.score < s.score) unique.set(key, s);
    }

    const result = [...unique.values()].sort((a, b) => b.score - a.score).slice(0, limit);

    for (const r of result) {
      await this.prisma.recommendationScore.upsert({
        where: {
          userId_entityType_entityId: { userId, entityType: r.entityType, entityId: r.entityId },
        },
        create: { userId, entityType: r.entityType, entityId: r.entityId, score: r.score, reason: r.reason },
        update: { score: r.score, reason: r.reason },
      });
    }

    return result;
  }
}
