import { Injectable, Logger } from '@nestjs/common';
import { Prisma, SearchEventType, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BuyerStoreService } from '../buyer/buyer-store.service';
import { checkStoreDeliverability } from '../../common/utils/geospatial.util';
import {
  checkStoreDeliverabilityWithCoverage,
  findActiveDeliveryArea,
} from '../../common/utils/delivery-coverage.util';
import { SearchCacheService } from './search-cache.service';
import { SearchAnalyticsService } from './search-analytics.service';
import { AdServingService } from '../ads/ad-serving.service';
import { SeoAnalyticsService } from '../seo/seo-analytics.service';
import { AdPlacement } from '@prisma/client';
import {
  computeHyperlocalScore,
  estimateDeliveryEtaMins,
  textRelevanceScore,
} from './search-ranking.util';
import type {
  BuyerSearchDto,
  DiscoverHomeDto,
  DiscoverStoresSearchDto,
  SearchSort,
  SearchSuggestionsDto,
  SearchTrendingDto,
} from './dto/search-discovery.dto';
import { buildProductTextSearchWhere } from './product-text-search.util';

const PRODUCT_VISIBLE: Prisma.ProductWhereInput = {
  isActive: true,
  deletedAt: null,
  variants: {
    some: {
      isActive: true,
      inventory: { availableQty: { gt: 0 }, status: 'ACTIVE' },
    },
  },
};

const STORE_VISIBLE: Prisma.StoreWhereInput = {
  status: StoreStatus.APPROVED,
  isActive: true,
  deletedAt: null,
};

@Injectable()
export class SearchDiscoveryService {
  private readonly logger = new Logger(SearchDiscoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storeService: BuyerStoreService,
    private readonly cache: SearchCacheService,
    private readonly analytics: SearchAnalyticsService,
    private readonly adServing: AdServingService,
    private readonly seoAnalytics: SeoAnalyticsService,
  ) {}

  async unifiedSearch(dto: BuyerSearchDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const sort = dto.sort ?? 'relevance';
    const tab = dto.tab ?? 'all';

    const cacheKey = this.cache.resultsKey([
      dto.q,
      dto.lat,
      dto.lng,
      dto.categoryId,
      dto.subcategoryId,
      dto.storeId,
      dto.minPrice,
      dto.maxPrice,
      sort,
      tab,
      page,
      limit,
    ]);

    return this.cache.wrap(cacheKey, async () => {
      const hasQuery = Boolean(dto.q && dto.q.trim().length >= 2);
      if (!hasQuery && !dto.categoryId && !dto.subcategoryId) {
        return this.emptySearchResult(page, limit);
      }

      const grantMap = await this.buildGrantMap();
      const offerStoreIds = await this.activeOfferStoreIds();
      const maxDistance = dto.lat != null ? 20 : 50;

      const [productRows, storeRows, categoryRows, brandRows] = await Promise.all([
        tab === 'stores' || tab === 'categories' ? [] : this.fetchProductCandidates(dto, grantMap),
        tab === 'products' || tab === 'categories' ? [] : this.fetchStoreCandidates(dto),
        tab === 'products' || tab === 'stores' ? [] : this.fetchCategoryCandidates(dto),
        tab === 'stores' || tab === 'categories' ? [] : this.fetchBrandCandidates(dto),
      ]);

      const maxQty = Math.max(1, ...productRows.map((p) => p.totalQty));

      const scoredProducts = productRows.map((row) => {
        const relevance = dto.q ? textRelevanceScore(row, dto.q) : 50;
        const distanceKm = this.productDistance(dto, row.store);
        const score = computeHyperlocalScore({
          relevance,
          distanceKm,
          maxDistanceKm: maxDistance,
          availableQty: row.totalQty,
          maxQtyInPool: maxQty,
          ratingAvg: row.store.ratingAvg,
          avgPrepTimeMins: row.store.avgPrepTimeMins,
          hasActiveOffer: offerStoreIds.has(row.storeId),
        });
        const price = row.minPrice;
        const eta =
          distanceKm != null
            ? estimateDeliveryEtaMins(distanceKm, row.store.avgPrepTimeMins)
            : row.store.avgPrepTimeMins;

        return {
          id: row.id,
          name: row.name,
          slug: row.slug,
          brand: row.brand,
          imageUrls: row.imageUrls,
          basePrice: price,
          mrp: row.mrp,
          category: row.category,
          store: {
            id: row.store.id,
            name: row.store.name,
            slug: row.store.slug,
            distanceKm: distanceKm ?? undefined,
            ratingAvg: row.store.ratingAvg,
            avgPrepTimeMins: row.store.avgPrepTimeMins,
            etaMins: eta,
            hasOffer: offerStoreIds.has(row.storeId),
          },
          inStock: row.totalQty > 0,
          availableQty: row.totalQty,
          score,
          sortPrice: price,
          sortEta: eta,
          sortRating: row.store.ratingAvg,
          sortDistance: distanceKm ?? 999,
        };
      });

      const sortedProducts = this.sortProducts(scoredProducts, sort);
      const totalProducts = sortedProducts.length;
      let products = sortedProducts.slice((page - 1) * limit, page * limit);

      if (hasQuery && dto.q && page === 1) {
        const sponsored = await this.adServing.getSponsoredProductsForSearch(dto.q, 3);
        const sponsoredIds = new Set(sponsored.map((s) => s.id).filter((id): id is string => !!id));
        products = [
          ...sponsored.map((s) => ({ ...s, sponsored: true } as unknown as (typeof products)[number])),
          ...products.filter((p) => !sponsoredIds.has(p.id)),
        ].slice(0, limit);
        for (const s of sponsored) {
          if (s.campaignId) void this.adServing.recordImpression(s.campaignId, AdPlacement.SEARCH);
        }
      }

      const stores = storeRows.slice(0, limit).map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        logoUrl: s.logoUrl,
        bannerUrl: s.bannerUrl,
        ratingAvg: s.ratingAvg,
        distanceKm: s.distanceKm,
        etaMins: s.etaMins,
        hasOffer: offerStoreIds.has(s.id),
        categories: s.categories,
      }));

      const categories = categoryRows.slice(0, 10);
      const subcategories = categoryRows.filter((c) => c.parentId).slice(0, 10);
      const brands = brandRows.slice(0, 10);

      if (hasQuery) {
        this.analytics.track({
          eventType: totalProducts === 0 ? SearchEventType.NO_RESULT : SearchEventType.QUERY,
          query: dto.q,
          buyerProfileId: dto.buyerProfileId,
          sessionId: dto.sessionId,
          lat: dto.lat,
          lng: dto.lng,
          metadata: { resultCount: totalProducts },
        });
        if (dto.q) void this.seoAnalytics.trackSearchKeyword(dto.q);
      }

      return {
        products,
        stores,
        categories,
        subcategories,
        brands,
        meta: {
          page,
          limit,
          totalProducts,
          totalPages: Math.ceil(totalProducts / limit),
          sort,
          tab,
        },
      };
    });
  }

  async suggestions(dto: SearchSuggestionsDto) {
    const q = dto.q.trim().toLowerCase();
    if (q.length < 1) {
      return { popularSearches: [], products: [], categories: [], stores: [] };
    }

    const key = this.cache.suggestionsKey(q, dto.lat, dto.lng);
    return this.cache.wrap(key, async () => {
      const [popularSearches, products, categories, stores] = await Promise.all([
        this.analytics.getTrendingQueries('7d', 5),
        this.prisma.product.findMany({
          where: {
            ...PRODUCT_VISIBLE,
            store: STORE_VISIBLE,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { brand: { contains: q, mode: 'insensitive' } },
            ],
          },
          select: { id: true, name: true, slug: true, brand: true, imageUrls: true },
          take: 6,
        }),
        this.prisma.category.findMany({
          where: {
            isActive: true,
            deletedAt: null,
            name: { contains: q, mode: 'insensitive' },
          },
          select: { id: true, name: true, slug: true, imageUrl: true },
          take: 5,
        }),
        this.prisma.store.findMany({
          where: {
            ...STORE_VISIBLE,
            name: { contains: q, mode: 'insensitive' },
          },
          select: { id: true, name: true, slug: true, logoUrl: true },
          take: 5,
        }),
      ]);

      return {
        popularSearches: popularSearches.map((p) => p.query),
        products,
        categories,
        stores,
      };
    });
  }

  async trending(dto: SearchTrendingDto) {
    const period = dto.period ?? '7d';
    const key = this.cache.trendingKey(period, dto.lat, dto.lng);
    return this.cache.wrap(key, async () => {
      const since = this.periodSince(period);
      const [queries, cartAdds, orderTerms] = await Promise.all([
        this.analytics.getTrendingQueries(period, 12),
        this.prisma.searchEvent.groupBy({
          by: ['query'],
          where: {
            eventType: SearchEventType.ADD_TO_CART,
            query: { not: null },
            createdAt: { gte: since },
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 8,
        }),
        this.prisma.orderItem.groupBy({
          by: ['productName'],
          where: { order: { createdAt: { gte: since } } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 8,
        }),
      ]);

      const merged = new Map<string, number>();
      for (const q of queries) merged.set(q.query, (merged.get(q.query) ?? 0) + q.count * 3);
      for (const c of cartAdds) {
        if (c.query) merged.set(c.query, (merged.get(c.query) ?? 0) + c._count.id * 2);
      }
      for (const o of orderTerms) {
        merged.set(o.productName.toLowerCase(), (merged.get(o.productName.toLowerCase()) ?? 0) + o._count.id);
      }

      const trending = [...merged.entries()]
        .map(([query, score]) => ({ query, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 15);

      return { period, trending };
    });
  }

  async discoverStores(dto: DiscoverStoresSearchDto) {
    const sortMap = {
      nearest: 'distance',
      best_rated: 'rating',
      fast_delivery: 'fast',
      new_stores: 'new',
      offers: 'popular',
    } as const;

    const filter = dto.filter ?? 'nearest';
    const key = this.cache.discoverKey([
      dto.lat,
      dto.lng,
      dto.radiusKm,
      filter,
      dto.page,
      dto.limit,
    ]);

    return this.cache.wrap(key, async () => {
      const { stores, total } = await this.storeService.discoverStores({
        lat: dto.lat,
        lng: dto.lng,
        radiusKm: dto.radiusKm,
        page: dto.page,
        limit: dto.limit,
        sort: sortMap[filter],
      });

      const offerMap = await this.storeOffersMap(stores.map((s) => s.id));
      const categoryMap = await this.storeCategoriesMap(stores.map((s) => s.id));

      let enriched = stores.map((s) => ({
        store: s,
        distance: s.distanceKm,
        eta: estimateDeliveryEtaMins(s.distanceKm, s.avgPrepTimeMins),
        rating: s.ratingAvg,
        offers: offerMap.get(s.id) ?? [],
        categories: categoryMap.get(s.id) ?? [],
      }));

      if (filter === 'offers') {
        enriched = enriched.filter((e) => e.offers.length > 0);
      }

      return {
        stores: enriched,
        total: filter === 'offers' ? enriched.length : total,
        filter,
      };
    });
  }

  async discoverHome(dto: DiscoverHomeDto) {
    const key = this.cache.discoverKey(['home', dto.lat, dto.lng, dto.buyerProfileId]);
    return this.cache.wrap(key, async () => {
      const base = { lat: dto.lat, lng: dto.lng, radiusKm: 15, page: 1, limit: 8 };

      const [
        trendingCategories,
        popularNearYou,
        fastDelivery,
        topRatedStores,
        dealsNearYou,
        recommendedForYou,
      ] = await Promise.all([
        this.homeTrendingCategories(),
        this.discoverStores({ ...base, filter: 'nearest' }),
        this.discoverStores({ ...base, filter: 'fast_delivery' }),
        this.discoverStores({ ...base, filter: 'best_rated' }),
        this.discoverStores({ ...base, filter: 'offers' }),
        this.recommendations(dto),
      ]);

      return {
        trendingCategories,
        popularNearYou: popularNearYou.stores,
        fastDelivery: fastDelivery.stores,
        topRatedStores: topRatedStores.stores,
        dealsNearYou: dealsNearYou.stores,
        recommendedForYou,
        sponsoredBanner: { title: 'Sponsored', stores: await this.adServing.getSponsoredStoresForHome(1) },
        featuredStore: (await this.adServing.getSponsoredStoresForHome(1))[0] ?? null,
        sponsoredProducts: await this.adServing.getSponsoredProductsForHome(6),
      };
    });
  }

  async recommendations(dto: DiscoverHomeDto) {
    const productIds: string[] = [];
    const categoryIds: string[] = [];

    if (dto.buyerProfileId) {
      const [orders, cart] = await Promise.all([
        this.prisma.order.findMany({
          where: { buyerProfileId: dto.buyerProfileId, status: { in: ['DELIVERED', 'COMPLETED'] } },
          select: { items: { select: { productId: true, product: { select: { categoryId: true } } } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        this.prisma.cart.findMany({
          where: { buyerProfileId: dto.buyerProfileId },
          select: { items: { select: { product: { select: { id: true, categoryId: true } } } } },
          take: 3,
        }),
      ]);

      for (const o of orders) {
        for (const i of o.items) {
          productIds.push(i.productId);
          if (i.product.categoryId) categoryIds.push(i.product.categoryId);
        }
      }
      for (const i of cart.flatMap((c) => c.items)) {
        productIds.push(i.product.id);
        if (i.product.categoryId) categoryIds.push(i.product.categoryId);
      }

      const searches = await this.prisma.searchEvent.findMany({
        where: { buyerProfileId: dto.buyerProfileId, eventType: SearchEventType.QUERY },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { query: true },
      });
      if (searches.length > 0) {
        const lastQ = searches[0]?.query;
        if (lastQ) {
          const result = await this.unifiedSearch({
            q: lastQ,
            lat: dto.lat,
            lng: dto.lng,
            limit: 6,
            page: 1,
            sort: 'relevance',
          });
          return result.products;
        }
      }
    }

    if (categoryIds.length > 0) {
      const catId = categoryIds[0];
      const result = await this.unifiedSearch({
        categoryId: catId,
        lat: dto.lat,
        lng: dto.lng,
        limit: 8,
        page: 1,
        sort: 'relevance',
      });
      return result.products;
    }

    const nearby = await this.discoverStores({
      lat: dto.lat,
      lng: dto.lng,
      filter: 'best_rated',
      limit: 6,
    });
    return nearby.stores;
  }

  private async homeTrendingCategories() {
    const since = this.periodSince('7d');
    const orderCats = await this.prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: since } } },
      select: { product: { select: { category: { select: { id: true, name: true, slug: true, imageUrl: true } } } } },
      take: 200,
    });
    const counts = new Map<string, { id: string; name: string; slug: string; imageUrl: string | null; count: number }>();
    for (const row of orderCats) {
      const c = row.product.category;
      if (!c) continue;
      const cur = counts.get(c.id) ?? { ...c, count: 0 };
      cur.count += 1;
      counts.set(c.id, cur);
    }
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  }

  private sortProducts<T extends { score: number; sortPrice: number; sortEta: number; sortRating: number; sortDistance: number }>(
    items: T[],
    sort: SearchSort,
  ): T[] {
    const copy = [...items];
    switch (sort) {
      case 'distance':
        return copy.sort((a, b) => a.sortDistance - b.sortDistance);
      case 'price_low_high':
        return copy.sort((a, b) => a.sortPrice - b.sortPrice);
      case 'price_high_low':
        return copy.sort((a, b) => b.sortPrice - a.sortPrice);
      case 'rating':
        return copy.sort((a, b) => b.sortRating - a.sortRating);
      case 'fastest_delivery':
        return copy.sort((a, b) => a.sortEta - b.sortEta);
      case 'relevance':
      default:
        return copy.sort((a, b) => b.score - a.score);
    }
  }

  private productDistance(
    dto: BuyerSearchDto,
    store: {
      latitude: number;
      longitude: number;
      deliveryRadiusKm?: number | null;
      storeServiceAreas?: Array<{ serviceArea: { centerLat: number; centerLng: number; radiusKm: number } }>;
      deliveryAreas?: Array<{ pincode: string; isActive: boolean }>;
    },
  ): number | null {
    if (dto.lat == null || dto.lng == null) return null;
    const d = checkStoreDeliverabilityWithCoverage(dto.lat, dto.lng, {
      latitude: store.latitude,
      longitude: store.longitude,
      deliveryRadiusKm: 20,
      storeServiceAreas: store.storeServiceAreas ?? [],
      deliveryAreas: store.deliveryAreas,
    }, { buyerPincode: dto.pincode });
    return d.distanceKm;
  }

  private async fetchProductCandidates(dto: BuyerSearchDto, grantMap: Map<string, Set<string>>) {
    const categoryId = dto.subcategoryId ?? dto.categoryId;
    const q = dto.q?.trim();
    const where: Prisma.ProductWhereInput = {
      ...PRODUCT_VISIBLE,
      store: {
        ...STORE_VISIBLE,
        ...(dto.pincode && {
          deliveryAreas: { some: { pincode: dto.pincode, isActive: true } },
        }),
      },
      ...(dto.storeId && { storeId: dto.storeId }),
      ...(categoryId && { categoryId }),
      ...(q && buildProductTextSearchWhere(q)),
    };

    const rows = await this.prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            latitude: true,
            longitude: true,
            ratingAvg: true,
            avgPrepTimeMins: true,
            deliveryRadiusKm: true,
            deliveryAreas: {
              where: { isActive: true },
              select: { pincode: true, isActive: true, priority: true, deliveryFee: true, minimumOrder: true, estimatedMinutes: true },
            },
            storeServiceAreas: {
              include: { serviceArea: { select: { centerLat: true, centerLng: true, radiusKm: true } } },
            },
          },
        },
        variants: {
          where: { isActive: true },
          include: { inventory: true },
          take: 3,
        },
      },
      take: 400,
    });

    return rows
      .filter((p) => p.categoryId && grantMap.get(p.storeId)?.has(p.categoryId))
      .map((p) => {
        const qty = p.variants.reduce(
          (s, v) => s + Math.max(0, v.inventory?.availableQty ?? 0),
          0,
        );
        const prices = p.variants.map((v) => Number(v.price));
        const minPrice = prices.length ? Math.min(...prices) : Number(p.basePrice);
        const defaultVariant = p.variants.find((v) => v.isDefault) ?? p.variants[0];
        return {
          id: p.id,
          storeId: p.storeId,
          name: p.name,
          slug: p.slug,
          brand: p.brand,
          description: p.description,
          tags: p.tags,
          imageUrls: p.imageUrls,
          category: p.category,
          store: p.store,
          totalQty: qty,
          minPrice,
          mrp: defaultVariant?.mrp ? Number(defaultVariant.mrp) : p.mrp ? Number(p.mrp) : null,
        };
      })
      .filter((p) => {
        if (dto.minPrice != null && p.minPrice < dto.minPrice) return false;
        if (dto.maxPrice != null && p.minPrice > dto.maxPrice) return false;
        if (dto.lat != null && dto.lng != null) {
          const pincodeMatch = dto.pincode
            ? Boolean(findActiveDeliveryArea(p.store.deliveryAreas, dto.pincode))
            : false;
          if (!pincodeMatch) {
            const d = this.productDistance(dto, p.store);
            if (d != null && d > 20) return false;
          }
        }
        return true;
      });
  }

  private async fetchStoreCandidates(dto: BuyerSearchDto) {
    if (!dto.q || dto.lat == null || dto.lng == null) return [];
    const q = dto.q.toLowerCase();
    const stores = await this.prisma.store.findMany({
      where: {
        ...STORE_VISIBLE,
        ...(dto.pincode && {
          deliveryAreas: { some: { pincode: dto.pincode, isActive: true } },
        }),
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { locality: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        storeServiceAreas: { include: { serviceArea: true } },
        deliveryAreas: {
          where: { isActive: true },
          select: { pincode: true, isActive: true, priority: true, deliveryFee: true, minimumOrder: true, estimatedMinutes: true },
        },
      },
      take: 30,
    });

    const categoryMap = await this.storeCategoriesMap(stores.map((s) => s.id));

    return stores
      .map((store) => {
        const deliverable = checkStoreDeliverabilityWithCoverage(dto.lat!, dto.lng!, store, {
          buyerPincode: dto.pincode,
        });
        if (!deliverable.deliverable) return null;
        const pincodeMatch = dto.pincode
          ? Boolean(findActiveDeliveryArea(store.deliveryAreas, dto.pincode))
          : false;
        if (!pincodeMatch && deliverable.distanceKm != null && deliverable.distanceKm > 20) return null;
        return {
          id: store.id,
          name: store.name,
          slug: store.slug,
          logoUrl: store.logoUrl,
          bannerUrl: store.bannerUrl,
          ratingAvg: store.ratingAvg,
          distanceKm: deliverable.distanceKm ?? 0,
          etaMins: estimateDeliveryEtaMins(deliverable.distanceKm ?? 0, store.avgPrepTimeMins),
          categories: categoryMap.get(store.id) ?? [],
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  private async fetchCategoryCandidates(dto: BuyerSearchDto) {
    if (!dto.q) return [];
    const q = dto.q.toLowerCase();
    return this.prisma.category.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        name: { contains: q, mode: 'insensitive' },
      },
      select: { id: true, name: true, slug: true, imageUrl: true, parentId: true },
      take: 15,
    });
  }

  private async fetchBrandCandidates(dto: BuyerSearchDto) {
    if (!dto.q) return [];
    const rows = await this.prisma.product.findMany({
      where: {
        ...PRODUCT_VISIBLE,
        brand: { contains: dto.q, mode: 'insensitive' },
      },
      select: { brand: true },
      distinct: ['brand'],
      take: 10,
    });
    return rows.filter((r) => r.brand).map((r) => ({ name: r.brand! }));
  }

  private async buildGrantMap() {
    const grants = await this.prisma.storeCategory.findMany({
      select: { storeId: true, subcategoryId: true },
    });
    const map = new Map<string, Set<string>>();
    for (const g of grants) {
      const set = map.get(g.storeId) ?? new Set<string>();
      set.add(g.subcategoryId);
      map.set(g.storeId, set);
    }
    return map;
  }

  private async activeOfferStoreIds(): Promise<Set<string>> {
    const now = new Date();
    const promos = await this.prisma.storePromotion.findMany({
      where: { isActive: true, expiresAt: { gt: now }, startsAt: { lte: now } },
      select: { storeId: true },
      distinct: ['storeId'],
    });
    return new Set(promos.map((p) => p.storeId));
  }

  private async storeOffersMap(storeIds: string[]) {
    if (storeIds.length === 0) return new Map<string, string[]>();
    const now = new Date();
    const promos = await this.prisma.storePromotion.findMany({
      where: {
        storeId: { in: storeIds },
        isActive: true,
        expiresAt: { gt: now },
        startsAt: { lte: now },
      },
      select: { storeId: true, name: true },
      take: 50,
    });
    const map = new Map<string, string[]>();
    for (const p of promos) {
      const list = map.get(p.storeId) ?? [];
      list.push(p.name);
      map.set(p.storeId, list);
    }
    return map;
  }

  private async storeCategoriesMap(storeIds: string[]) {
    if (storeIds.length === 0) return new Map<string, { id: string; name: string }[]>();
    const grants = await this.prisma.storeCategory.findMany({
      where: { storeId: { in: storeIds } },
      include: { subcategory: { select: { id: true, name: true } } },
    });
    const map = new Map<string, { id: string; name: string }[]>();
    for (const g of grants) {
      const list = map.get(g.storeId) ?? [];
      list.push({ id: g.subcategory.id, name: g.subcategory.name });
      map.set(g.storeId, list);
    }
    return map;
  }

  private periodSince(period: '24h' | '7d' | '30d') {
    const ms =
      period === '24h' ? 86_400_000 : period === '7d' ? 7 * 86_400_000 : 30 * 86_400_000;
    return new Date(Date.now() - ms);
  }

  private emptySearchResult(page: number, limit: number) {
    return {
      products: [],
      stores: [],
      categories: [],
      subcategories: [],
      brands: [],
      meta: { page, limit, totalProducts: 0, totalPages: 0, sort: 'relevance', tab: 'all' },
    };
  }
}
