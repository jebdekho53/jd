import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  assertActiveGlobalCategory,
  fetchActiveGlobalCategories,
  fetchStoreVisibleCategories,
} from './buyer-category-catalog';
import { BuyerCacheService, BUYER_CACHE_KEYS } from './buyer-cache.service';
import { SearchProductsDto } from './dto/search-products.dto';
import { StoreProductsDto } from './dto/store-products.dto';
import {
  computeHyperlocalScore,
  estimateDeliveryEtaMins,
  textRelevanceScore,
} from '../search-discovery/search-ranking.util';
import { buildProductTextSearchWhere } from '../search-discovery/product-text-search.util';
import {
  canDeliverToBuyer,
  DEFAULT_BUYER_DISCOVERY_RADIUS_KM,
  PRODUCT_VISIBLE_WHERE,
  STORE_DISCOVERY_INCLUDE,
  STORE_VISIBLE_WHERE,
  toDeliverableStoreShape,
} from './buyer-visibility.util';

// ── Response shapes ───────────────────────────────────────────────────────────

export interface BuyerVariant {
  id: string;
  name: string;
  price: number;
  mrp: number | null;
  weightGrams: number | null;
  isDefault: boolean;
  availableQty: number;
}

export interface BuyerProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  imageUrls: string[];
  basePrice: number;
  mrp: number | null;
  unit: string;
  isVeg: boolean | null;
  tags: string[];
  category: { id: string; name: string; slug: string } | null;
  variants: BuyerVariant[];
}

export interface BuyerProductWithStore extends BuyerProduct {
  store: { id: string; name: string; slug: string; distanceKm?: number; ratingAvg?: number; avgPrepTimeMins?: number };
}

export interface StoreSearchGroup {
  store: { id: string; name: string; slug: string; distanceKm?: number; ratingAvg: number; avgPrepTimeMins: number };
  products: BuyerProduct[];
  productCount: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  children: CategoryItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchStoreProductCategoryIds(
  prisma: PrismaService,
  storeId: string,
): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { storeId, ...PRODUCT_VISIBLE_WHERE, categoryId: { not: null } },
    select: { categoryId: true },
    distinct: ['categoryId'],
  });
  return rows.map((r) => r.categoryId!).filter(Boolean);
}

function mapVariant(v: {
  id: string;
  name: string;
  price: Prisma.Decimal;
  mrp: Prisma.Decimal | null;
  weightGrams: number | null;
  isDefault: boolean;
  inventory: { availableQty: number; reservedQty: number; status?: string } | null;
}): BuyerVariant {
  return {
    id: v.id,
    name: v.name,
    price: Number(v.price),
    mrp: v.mrp ? Number(v.mrp) : null,
    weightGrams: v.weightGrams,
    isDefault: v.isDefault,
    availableQty: v.inventory
      ? Math.max(0, v.inventory.availableQty)
      : 0,
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class BuyerProductService {
  private readonly logger = new Logger(BuyerProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: BuyerCacheService,
  ) {}

  // ── Products for a visible store ─────────────────────────────────────────

  async listStoreProducts(
    storeId: string,
    dto: StoreProductsDto,
  ): Promise<{ products: BuyerProduct[]; total: number }> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    if (dto.categoryId) {
      await this.assertCategoryInCatalog(dto.categoryId);
    }

    const cacheKey = BUYER_CACHE_KEYS.storeProducts(storeId, dto.categoryId, page, limit);

    return this.cache.wrap(cacheKey, async () => {
      const productCategoryIds = await fetchStoreProductCategoryIds(this.prisma, storeId);
      if (productCategoryIds.length === 0) {
        return { products: [], total: 0 };
      }
      if (dto.categoryId && !productCategoryIds.includes(dto.categoryId)) {
        return { products: [], total: 0 };
      }

      const where: Prisma.ProductWhereInput = {
        ...PRODUCT_VISIBLE_WHERE,
        storeId,
        store: STORE_VISIBLE_WHERE,
        categoryId: dto.categoryId ?? { in: productCategoryIds },
      };

      const [raw, total] = await this.prisma.$transaction([
        this.prisma.product.findMany({
          where,
          include: {
            variants: {
              where: { isActive: true },
              include: { inventory: true },
              orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
            },
            category: { select: { id: true, name: true, slug: true } },
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.product.count({ where }),
      ]);

      const products = raw.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        brand: p.brand,
        imageUrls: p.imageUrls,
        basePrice: Number(p.basePrice),
        mrp: p.mrp ? Number(p.mrp) : null,
        unit: p.unit,
        isVeg: p.isVeg,
        tags: p.tags,
        category: p.category,
        variants: p.variants.map(mapVariant),
      })) satisfies BuyerProduct[];

      return { products, total };
    });
  }

  // ── Single product by ID (PDP) ───────────────────────────────────────────

  async getProductById(
    productId: string,
    storeSlug?: string,
  ): Promise<BuyerProductWithStore | null> {
    const cacheKey = BUYER_CACHE_KEYS.productDetail(productId, storeSlug);

    return this.cache.wrap(cacheKey, async () => {
      const storeWhere: Prisma.StoreWhereInput = storeSlug
        ? { ...STORE_VISIBLE_WHERE, slug: storeSlug }
        : STORE_VISIBLE_WHERE;

      const raw = await this.prisma.product.findFirst({
        where: {
          ...PRODUCT_VISIBLE_WHERE,
          id: productId,
          store: storeWhere,
        },
        include: {
          variants: {
            where: { isActive: true },
            include: { inventory: true },
            orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
          },
          category: { select: { id: true, name: true, slug: true } },
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              ratingAvg: true,
              avgPrepTimeMins: true,
            },
          },
        },
      });

      if (!raw) return null;

      return {
        id: raw.id,
        name: raw.name,
        slug: raw.slug,
        description: raw.description,
        brand: raw.brand,
        imageUrls: raw.imageUrls,
        basePrice: Number(raw.basePrice),
        mrp: raw.mrp ? Number(raw.mrp) : null,
        unit: raw.unit,
        isVeg: raw.isVeg,
        tags: raw.tags,
        category: raw.category,
        variants: raw.variants.map(mapVariant),
        store: {
          id: raw.store.id,
          name: raw.store.name,
          slug: raw.store.slug,
          ratingAvg: raw.store.ratingAvg ? Number(raw.store.ratingAvg) : undefined,
          avgPrepTimeMins: raw.store.avgPrepTimeMins ?? undefined,
        },
      } satisfies BuyerProductWithStore;
    });
  }

  // ── Full-text product search with field-weighted ranking ────────────────
  //
  // Ranking: name (100) > brand (50) > tags (25) > description (10)
  // Exact matches score higher than partial matches (× 2 multiplier).

  async searchProducts(
    dto: SearchProductsDto,
  ): Promise<{ products: BuyerProductWithStore[]; total: number }> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const effectiveCategoryId = dto.subcategoryId ?? dto.categoryId;

    if (effectiveCategoryId) {
      await this.assertCategoryInCatalog(effectiveCategoryId);
    }

    const cacheKey = BUYER_CACHE_KEYS.productSearch(
      dto.q,
      dto.categoryId,
      dto.subcategoryId,
      dto.storeId,
      page,
      limit,
    );

    return this.cache.wrap(cacheKey, async () => {
      const where: Prisma.ProductWhereInput = {
        ...PRODUCT_VISIBLE_WHERE,
        store: STORE_VISIBLE_WHERE,
        ...(dto.storeId && { storeId: dto.storeId }),
        ...(dto.subcategoryId && { categoryId: dto.subcategoryId }),
        ...(!dto.subcategoryId && dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.q && buildProductTextSearchWhere(dto.q)),
      };

      // Fetch a larger batch so JS ranking has enough candidates.
      // Cap at 500 to bound memory; real traffic won't approach this for a
      // single store/city context.
      const RANK_POOL = Math.min(500, page * limit * 5);

      const [rawUnfiltered, totalUnfiltered] = await this.prisma.$transaction([
        this.prisma.product.findMany({
          where,
          include: {
            variants: {
              where: { isActive: true },
              include: { inventory: true },
              orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
            },
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
              },
            },
          },
          take: RANK_POOL,
        }),
        this.prisma.product.count({ where }),
      ]);

      const raw = rawUnfiltered.filter((p) => Boolean(p.categoryId));
      const total = dto.storeId ? totalUnfiltered : raw.length;

      const discoveryRadiusKm = DEFAULT_BUYER_DISCOVERY_RADIUS_KM;
      const storeIds = [...new Set(raw.map((p) => p.storeId))];
      const storeGeoRows =
        storeIds.length > 0 && dto.lat != null && dto.lng != null
          ? await this.prisma.store.findMany({
              where: { id: { in: storeIds }, ...STORE_VISIBLE_WHERE },
              include: STORE_DISCOVERY_INCLUDE,
            })
          : [];
      const storeGeoMap = new Map(storeGeoRows.map((s) => [s.id, s]));

      const offerStoreIds = await this.activeOfferStoreIds();
      const maxQty = Math.max(
        1,
        ...raw.map((p) =>
          p.variants.reduce((s, v) => s + Math.max(0, v.inventory?.availableQty ?? 0), 0),
        ),
      );

      const scored = raw.map((p) => {
        const totalQty = p.variants.reduce(
          (s, v) => s + Math.max(0, v.inventory?.availableQty ?? 0),
          0,
        );
        const prices = p.variants.map((v) => Number(v.price));
        const minPrice = prices.length ? Math.min(...prices) : Number(p.basePrice);

        if (dto.minPrice != null && minPrice < dto.minPrice) return null;
        if (dto.maxPrice != null && minPrice > dto.maxPrice) return null;

        let distanceKm: number | null = null;
        if (dto.lat != null && dto.lng != null) {
          const storeGeo = storeGeoMap.get(p.storeId);
          if (!storeGeo) return null;
          const eligibility = canDeliverToBuyer(storeGeo, {
            lat: dto.lat,
            lng: dto.lng,
            pincode: dto.pincode,
            discoveryRadiusKm,
          });
          if (!eligibility.eligible) return null;
          distanceKm = eligibility.deliverable.distanceKm;
        }

        const relevance = dto.q ? textRelevanceScore(p, dto.q) : 50;
        const hyperScore = computeHyperlocalScore({
          relevance,
          distanceKm,
          maxDistanceKm: DEFAULT_BUYER_DISCOVERY_RADIUS_KM,
          availableQty: totalQty,
          maxQtyInPool: maxQty,
          ratingAvg: p.store.ratingAvg,
          avgPrepTimeMins: p.store.avgPrepTimeMins,
          hasActiveOffer: offerStoreIds.has(p.storeId),
        });

        return {
          product: p,
          hyperScore,
          distanceKm,
          minPrice,
          eta:
            distanceKm != null
              ? estimateDeliveryEtaMins(distanceKm, p.store.avgPrepTimeMins)
              : p.store.avgPrepTimeMins,
        };
      }).filter((x): x is NonNullable<typeof x> => x !== null);

      const sorted = this.sortScoredProducts(scored, dto.sort ?? (dto.q ? 'relevance' : 'distance'));
      const paginated = sorted.slice((page - 1) * limit, page * limit).map((x) => x.product);

      const products = paginated.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        brand: p.brand,
        imageUrls: p.imageUrls,
        basePrice: Number(p.basePrice),
        mrp: p.mrp ? Number(p.mrp) : null,
        unit: p.unit,
        isVeg: p.isVeg,
        tags: p.tags,
        category: p.category,
        variants: p.variants.map(mapVariant),
        store: {
          id: p.store.id,
          name: p.store.name,
          slug: p.store.slug,
          ratingAvg: p.store.ratingAvg,
          avgPrepTimeMins: p.store.avgPrepTimeMins,
        },
      })) satisfies BuyerProductWithStore[];

      return { products, total };
    });
  }

  async searchProductsGrouped(
    dto: SearchProductsDto,
  ): Promise<{ groups: StoreSearchGroup[]; total: number }> {
    const { products, total } = await this.searchProducts({ ...dto, limit: 100, page: 1 });
    const byStore = new Map<string, StoreSearchGroup>();

    for (const product of products) {
      const existing = byStore.get(product.store.id);
      const { store, ...rest } = product;
      if (existing) {
        existing.products.push(rest);
        existing.productCount += 1;
      } else {
        byStore.set(product.store.id, {
          store: {
            id: store.id,
            name: store.name,
            slug: store.slug,
            ratingAvg: store.ratingAvg ?? 0,
            avgPrepTimeMins: store.avgPrepTimeMins ?? 15,
          },
          products: [rest],
          productCount: 1,
        });
      }
    }

    const groups = [...byStore.values()];
    return { groups, total };
  }

  // ── Category listing ────────────────────────────────────────────────────

  async listCategories(
    storeId?: string,
  ): Promise<CategoryItem[]> {
    const cacheKey = BUYER_CACHE_KEYS.categories(storeId);

    return this.cache.wrap(cacheKey, async () => {
      if (storeId) {
        const store = await this.prisma.store.findFirst({
          where: { id: storeId, deletedAt: null, ...STORE_VISIBLE_WHERE },
          select: { id: true },
        });
        if (!store) {
          this.logger.debug(`listCategories: store ${storeId} not visible — returning []`);
          return [];
        }
        const categories = await fetchStoreVisibleCategories(this.prisma, storeId);
        this.logger.log(
          `listCategories storeId=${storeId} → ${categories.length} store-visible categories`,
        );
        return categories;
      }

      const categories = await fetchActiveGlobalCategories(this.prisma);
      this.logger.log(
        `listCategories storeId=${storeId ?? 'global'} → ${categories.length} active global categories`,
      );
      return categories;
    });
  }

  private async assertCategoryInCatalog(categoryId: string): Promise<void> {
    try {
      await assertActiveGlobalCategory(this.prisma, categoryId);
    } catch {
      throw new BadRequestException('Category is not available');
    }
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

  private sortScoredProducts<
    T extends { hyperScore: number; distanceKm: number | null; minPrice: number; eta: number; product: { store: { ratingAvg: number } } },
  >(items: T[], sort: string): T[] {
    const copy = [...items];
    switch (sort) {
      case 'distance':
        return copy.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
      case 'price_low_high':
        return copy.sort((a, b) => a.minPrice - b.minPrice);
      case 'price_high_low':
        return copy.sort((a, b) => b.minPrice - a.minPrice);
      case 'rating':
        return copy.sort((a, b) => b.product.store.ratingAvg - a.product.store.ratingAvg);
      case 'fastest_delivery':
        return copy.sort((a, b) => a.eta - b.eta);
      case 'relevance':
      default:
        return copy.sort((a, b) => b.hyperScore - a.hyperScore);
    }
  }
}
