import { Injectable, Logger } from '@nestjs/common';
import { Prisma, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BuyerCacheService, BUYER_CACHE_KEYS } from './buyer-cache.service';
import { SearchProductsDto } from './dto/search-products.dto';
import { StoreProductsDto } from './dto/store-products.dto';

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
  store: { id: string; name: string; slug: string };
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

/**
 * A product is visible to buyers when:
 *   - isActive = true
 *   - deletedAt = null
 *   - at least one active variant has available inventory > 0
 */
const PRODUCT_VISIBLE_WHERE: Prisma.ProductWhereInput = {
  isActive: true,
  deletedAt: null,
  variants: {
    some: {
      isActive: true,
      inventory: { quantity: { gt: 0 } },
    },
  },
};

/** Visible store conditions for joins. */
const STORE_VISIBLE_WHERE: Prisma.StoreWhereInput = {
  status: StoreStatus.APPROVED,
  isActive: true,
  deletedAt: null,
};

function mapVariant(v: {
  id: string;
  name: string;
  price: Prisma.Decimal;
  mrp: Prisma.Decimal | null;
  weightGrams: number | null;
  isDefault: boolean;
  inventory: { quantity: number; reserved: number } | null;
}): BuyerVariant {
  return {
    id: v.id,
    name: v.name,
    price: Number(v.price),
    mrp: v.mrp ? Number(v.mrp) : null,
    weightGrams: v.weightGrams,
    isDefault: v.isDefault,
    availableQty: v.inventory
      ? Math.max(0, v.inventory.quantity - v.inventory.reserved)
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
    const cacheKey = BUYER_CACHE_KEYS.storeProducts(storeId, dto.categoryId, page, limit);

    return this.cache.wrap(cacheKey, async () => {
      const where: Prisma.ProductWhereInput = {
        ...PRODUCT_VISIBLE_WHERE,
        storeId,
        store: STORE_VISIBLE_WHERE,
        ...(dto.categoryId && { categoryId: dto.categoryId }),
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

  // ── Full-text product search with field-weighted ranking ────────────────
  //
  // Ranking: name (100) > brand (50) > tags (25) > description (10)
  // Exact matches score higher than partial matches (× 2 multiplier).

  async searchProducts(
    dto: SearchProductsDto,
  ): Promise<{ products: BuyerProductWithStore[]; total: number }> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const cacheKey = BUYER_CACHE_KEYS.productSearch(
      dto.q,
      dto.categoryId,
      dto.storeId,
      page,
      limit,
    );

    return this.cache.wrap(cacheKey, async () => {
      const where: Prisma.ProductWhereInput = {
        ...PRODUCT_VISIBLE_WHERE,
        store: STORE_VISIBLE_WHERE,
        ...(dto.storeId && { storeId: dto.storeId }),
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.q && {
          searchIndex: {
            searchText: { contains: dto.q.toLowerCase() },
            isActive: true,
          },
        }),
      };

      // Fetch a larger batch so JS ranking has enough candidates.
      // Cap at 500 to bound memory; real traffic won't approach this for a
      // single store/city context.
      const RANK_POOL = Math.min(500, page * limit * 5);

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
            store: { select: { id: true, name: true, slug: true } },
          },
          take: RANK_POOL,
        }),
        this.prisma.product.count({ where }),
      ]);

      // Score and sort only when a query term is present.
      const scored = dto.q
        ? raw
            .map((p) => ({ product: p, score: rankProduct(p, dto.q!) }))
            .sort((a, b) => b.score - a.score)
            .map((x) => x.product)
        : raw;

      const paginated = scored.slice((page - 1) * limit, page * limit);

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
        store: p.store,
      })) satisfies BuyerProductWithStore[];

      return { products, total };
    });
  }

  // ── Category listing ────────────────────────────────────────────────────

  async listCategories(
    storeId?: string,
  ): Promise<CategoryItem[]> {
    const cacheKey = BUYER_CACHE_KEYS.categories(storeId);

    return this.cache.wrap(cacheKey, async () => {
      // Return top-level categories (no parent) — include children inline
      const rows = await this.prisma.category.findMany({
        where: {
          parentId: null,
          isActive: true,
          OR: [
            { storeId: null },
            ...(storeId ? [{ storeId }] : []),
          ],
        },
        include: {
          children: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              slug: true,
              imageUrl: true,
              parentId: true,
              sortOrder: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });

      return rows.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        imageUrl: c.imageUrl,
        parentId: c.parentId,
        sortOrder: c.sortOrder,
        children: c.children.map((ch) => ({
          id: ch.id,
          name: ch.name,
          slug: ch.slug,
          imageUrl: ch.imageUrl,
          parentId: ch.parentId,
          sortOrder: ch.sortOrder,
          children: [],
        })),
      })) satisfies CategoryItem[];
    });
  }
}

// ── Search ranking ────────────────────────────────────────────────────────────
//
// Field weights:  name=100  brand=50  tags=25  description=10
// Exact match:    score × 2
// Partial match:  score × 1

function rankProduct(
  p: { name: string; brand: string | null; tags: string[]; description: string | null },
  rawQuery: string,
): number {
  const q = rawQuery.toLowerCase().trim();
  if (!q) return 0;

  let score = 0;

  const nameL = p.name.toLowerCase();
  if (nameL === q) score += 200;           // exact
  else if (nameL.includes(q)) score += 100; // partial

  const brandL = (p.brand ?? '').toLowerCase();
  if (brandL === q) score += 100;
  else if (brandL.includes(q)) score += 50;

  for (const tag of p.tags) {
    const tagL = tag.toLowerCase();
    if (tagL === q) score += 50;
    else if (tagL.includes(q)) score += 25;
  }

  const descL = (p.description ?? '').toLowerCase();
  if (descL.includes(q)) score += 10;

  return score;
}
