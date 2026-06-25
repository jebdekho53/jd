import { Injectable, Logger } from '@nestjs/common';
import { Prisma, SearchEventType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface TrackSearchEventInput {
  eventType: SearchEventType;
  query?: string;
  buyerProfileId?: string;
  sessionId?: string;
  productId?: string;
  storeId?: string;
  categoryId?: string;
  lat?: number;
  lng?: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class SearchAnalyticsService {
  private readonly logger = new Logger(SearchAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  track(input: TrackSearchEventInput): void {
    void this.prisma.searchEvent
      .create({
        data: {
          eventType: input.eventType,
          query: input.query?.slice(0, 200),
          buyerProfileId: input.buyerProfileId,
          sessionId: input.sessionId,
          productId: input.productId,
          storeId: input.storeId,
          categoryId: input.categoryId,
          lat: input.lat,
          lng: input.lng,
          metadata: input.metadata as Prisma.InputJsonValue | undefined,
        },
      })
      .catch((err) => this.logger.warn(`Search event track failed: ${(err as Error).message}`));
  }

  private sinceForPeriod(period: '24h' | '7d' | '30d'): Date {
    const ms =
      period === '24h' ? 86_400_000 : period === '7d' ? 7 * 86_400_000 : 30 * 86_400_000;
    return new Date(Date.now() - ms);
  }

  async getTrendingQueries(period: '24h' | '7d' | '30d', limit = 10) {
    const since = this.sinceForPeriod(period);
    const rows = await this.prisma.searchEvent.groupBy({
      by: ['query'],
      where: {
        eventType: { in: [SearchEventType.QUERY, SearchEventType.CLICK] },
        query: { not: null },
        createdAt: { gte: since },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });
    return rows
      .filter((r) => r.query)
      .map((r) => ({ query: r.query!, count: r._count.id }));
  }

  async getAdminAnalytics(period: '24h' | '7d' | '30d' = '7d') {
    const since = this.sinceForPeriod(period);

    const [topSearches, noResults, queries, clicks, orders] = await Promise.all([
      this.getTrendingQueries(period, 20),
      this.prisma.searchEvent.groupBy({
        by: ['query'],
        where: { eventType: SearchEventType.NO_RESULT, createdAt: { gte: since }, query: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 15,
      }),
      this.prisma.searchEvent.count({ where: { eventType: SearchEventType.QUERY, createdAt: { gte: since } } }),
      this.prisma.searchEvent.count({ where: { eventType: SearchEventType.CLICK, createdAt: { gte: since } } }),
      this.prisma.searchEvent.count({ where: { eventType: SearchEventType.ORDER, createdAt: { gte: since } } }),
    ]);

    const lowConversion = topSearches
      .map((t) => ({ query: t.query, searches: t.count }))
      .slice(0, 10);

    const trendingCategories = await this.prisma.searchEvent.groupBy({
      by: ['categoryId'],
      where: { categoryId: { not: null }, createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const categoryNames = await this.prisma.category.findMany({
      where: { id: { in: trendingCategories.map((c) => c.categoryId!).filter(Boolean) } },
      select: { id: true, name: true },
    });
    const catMap = new Map(categoryNames.map((c) => [c.id, c.name]));

    const trendingStores = await this.prisma.searchEvent.groupBy({
      by: ['storeId'],
      where: { storeId: { not: null }, createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const storeNames = await this.prisma.store.findMany({
      where: { id: { in: trendingStores.map((s) => s.storeId!).filter(Boolean) } },
      select: { id: true, name: true },
    });
    const storeMap = new Map(storeNames.map((s) => [s.id, s.name]));

    return {
      period,
      topSearches,
      noResultSearches: noResults.map((r) => ({ query: r.query!, count: r._count.id })),
      lowConversionSearches: lowConversion,
      conversionRate: queries > 0 ? Math.round((orders / queries) * 1000) / 10 : 0,
      clickThroughRate: queries > 0 ? Math.round((clicks / queries) * 1000) / 10 : 0,
      trendingCategories: trendingCategories.map((c) => ({
        categoryId: c.categoryId,
        name: catMap.get(c.categoryId!) ?? 'Category',
        count: c._count.id,
      })),
      trendingStores: trendingStores.map((s) => ({
        storeId: s.storeId,
        name: storeMap.get(s.storeId!) ?? 'Store',
        count: s._count.id,
      })),
    };
  }

  async getMerchantInsights(storeId: string, period: '7d' | '30d' = '7d') {
    const since = this.sinceForPeriod(period);
    const [impressions, clicks, addToCart, orders, topQueries] = await Promise.all([
      this.prisma.searchEvent.count({
        where: { storeId, eventType: SearchEventType.IMPRESSION, createdAt: { gte: since } },
      }),
      this.prisma.searchEvent.count({
        where: { storeId, eventType: SearchEventType.CLICK, createdAt: { gte: since } },
      }),
      this.prisma.searchEvent.count({
        where: { storeId, eventType: SearchEventType.ADD_TO_CART, createdAt: { gte: since } },
      }),
      this.prisma.searchEvent.count({
        where: { storeId, eventType: SearchEventType.ORDER, createdAt: { gte: since } },
      }),
      this.prisma.searchEvent.groupBy({
        by: ['query'],
        where: {
          storeId,
          query: { not: null },
          eventType: { in: [SearchEventType.QUERY, SearchEventType.CLICK] },
          createdAt: { gte: since },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    const lostSearches = await this.prisma.searchEvent.groupBy({
      by: ['query'],
      where: {
        storeId,
        eventType: SearchEventType.NO_RESULT,
        createdAt: { gte: since },
        query: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    return {
      period,
      impressions,
      clicks,
      ctr: impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : 0,
      addToCart,
      orders,
      conversionRate: clicks > 0 ? Math.round((orders / clicks) * 1000) / 10 : 0,
      topSearchedProducts: topQueries.map((q) => ({ query: q.query!, count: q._count.id })),
      lostSearches: lostSearches.map((q) => ({ query: q.query!, count: q._count.id })),
    };
  }
}
