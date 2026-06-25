import { Injectable } from '@nestjs/common';
import { AiCrawlerType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { detectCrawlerType, parseEntityFromPath } from './ai-crawler.util';

@Injectable()
export class AiCrawlerAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordVisit(input: {
    userAgent?: string;
    path: string;
    ipAddress?: string;
  }) {
    const crawlerType = detectCrawlerType(input.userAgent);
    if (!crawlerType) return null;

    const entity = parseEntityFromPath(input.path);
    return this.prisma.aiCrawlerVisit.create({
      data: {
        crawlerUserAgent: input.userAgent ?? 'unknown',
        crawlerType,
        path: input.path,
        ipAddress: input.ipAddress,
        indexedEntityType: entity?.type,
        indexedEntityId: entity?.id,
      },
    });
  }

  async getMetrics(sinceDays = 30) {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const [byType, topPaths, total] = await Promise.all([
      this.prisma.aiCrawlerVisit.groupBy({
        by: ['crawlerType'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
      }),
      this.prisma.aiCrawlerVisit.groupBy({
        by: ['path'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),
      this.prisma.aiCrawlerVisit.count({ where: { createdAt: { gte: since } } }),
    ]);

    const indexedEntities = await this.prisma.aiCrawlerVisit.groupBy({
      by: ['indexedEntityType'],
      where: { createdAt: { gte: since }, indexedEntityType: { not: null } },
      _count: { id: true },
    });

    return { total, byType, topPaths, indexedEntities };
  }

  async getCrawlHealth() {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await this.prisma.aiCrawlerVisit.count({ where: { createdAt: { gte: last24h } } });
    const aiTypes: AiCrawlerType[] = [
      AiCrawlerType.CHATGPT,
      AiCrawlerType.GEMINI,
      AiCrawlerType.PERPLEXITY,
      AiCrawlerType.CLAUDE,
      AiCrawlerType.BING_AI,
    ];
    const activeEngines = await this.prisma.aiCrawlerVisit.groupBy({
      by: ['crawlerType'],
      where: { createdAt: { gte: last24h }, crawlerType: { in: aiTypes } },
      _count: { id: true },
    });
    return {
      visitsLast24h: recent,
      activeAiEngines: activeEngines.length,
      health: recent > 0 ? 'healthy' : 'idle',
    };
  }
}
