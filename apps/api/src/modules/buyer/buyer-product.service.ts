import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { MembershipBenefitType, Prisma, StorePromotion } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  assertActiveGlobalCategory,
  fetchActiveGlobalCategories,
  fetchStoreVisibleCategories,
} from './buyer-category-catalog';
import { BuyerCacheService, BUYER_CACHE_KEYS } from './buyer-cache.service';
import { SearchProductsDto } from './dto/search-products.dto';
import { CompareProductDto } from './dto/compare-product.dto';
import { buildCompareResult, type CompareStoreOffer } from './compare-product.util';
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
import { resolveDeliveryTerms } from '../../common/utils/delivery-coverage.util';
import { normalizeDeliveryPartnerLabel, resolveStoreDeliveryPartnerLabel } from './logistics-label.util';
import { buildReturnPolicySummary } from '../../common/utils/product-return-policy.util';
import { hasProductBuyerComplianceGaps } from '../../common/utils/product-compliance.util';
import type { ReturnPolicySummary } from '../../common/utils/product-return-policy.util';
import { ConfigService } from '@nestjs/config';

// ── Response shapes ───────────────────────────────────────────────────────────

export interface BuyerVariant {
  id: string;
  name: string;
  price: number;
  mrp: number | null;
  weightGrams: number | null;
  size: string | null;
  color: string | null;
  isDefault: boolean;
  availableQty: number;
}

export interface BuyerProductMetadata {
  ingredients: string | null;
  shelfLife: string | null;
  countryOfOrigin: string | null;
  manufacturerName: string | null;
  manufacturerAddress: string | null;
  fssaiLicense: string | null;
  hsnCode: string | null;
  taxInclusive: boolean;
  storageInstructions: string | null;
  disclaimer: string | null;
}

export interface BuyerProductReviewSummary {
  ratingAvg: number;
  ratingCount: number;
}

export interface BuyerProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  modelNumber?: string | null;
  warrantyMonths?: number | null;
  specifications?: unknown;
  imageUrls: string[];
  basePrice: number;
  mrp: number | null;
  unit: string;
  isVeg: boolean | null;
  tags: string[];
  category: { id: string; name: string; slug: string } | null;
  variants: BuyerVariant[];
  metadata?: BuyerProductMetadata;
  reviewSummary?: BuyerProductReviewSummary;
  returnPolicy?: ReturnPolicySummary;
}

export interface BuyerProductWithStore extends BuyerProduct {
  store: {
    id: string;
    name: string;
    slug: string;
    distanceKm?: number;
    ratingAvg?: number;
    ratingCount?: number;
    avgPrepTimeMins?: number;
    deliveryFee?: number;
    minOrderAmount?: number;
    deliveryPartner?: string;
  };
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

type ProductComplianceRow = {
  imageUrls: string[];
  categoryId: string | null;
  category: { slug: string; name: string } | null;
  hsnCodeId: string | null;
  fssaiLicense: string | null;
  taxCategory: string;
};

function isBuyerCompliantProduct(
  product: ProductComplianceRow,
  storeFssaiLicense?: string | null,
): boolean {
  return !hasProductBuyerComplianceGaps({
    imageUrls: product.imageUrls,
    categoryId: product.categoryId,
    category: product.category,
    hsnCodeId: product.hsnCodeId,
    fssaiLicense: product.fssaiLicense,
    taxCategory: product.taxCategory,
    storeFssaiLicense,
  });
}

function mapVariant(v: {
  id: string;
  name: string;
  price: Prisma.Decimal;
  mrp: Prisma.Decimal | null;
  weightGrams: number | null;
  size?: string | null;
  color?: string | null;
  isDefault: boolean;
  inventory: { availableQty: number; reservedQty: number; status?: string } | null;
}): BuyerVariant {
  return {
    id: v.id,
    name: v.name,
    price: Number(v.price),
    mrp: v.mrp ? Number(v.mrp) : null,
    weightGrams: v.weightGrams,
    size: v.size ?? null,
    color: v.color ?? null,
    isDefault: v.isDefault,
    availableQty: v.inventory
      ? Math.max(0, v.inventory.availableQty)
      : 0,
  };
}

function mapProductMetadata(raw: {
  ingredients: string | null;
  shelfLife: string | null;
  countryOfOrigin: string | null;
  manufacturerName: string | null;
  manufacturerAddress: string | null;
  fssaiLicense: string | null;
  taxInclusive: boolean;
  storageInstructions: string | null;
  disclaimer: string | null;
  hsnCodeRef: { code: string } | null;
}): BuyerProductMetadata {
  return {
    ingredients: raw.ingredients,
    shelfLife: raw.shelfLife,
    countryOfOrigin: raw.countryOfOrigin,
    manufacturerName: raw.manufacturerName,
    manufacturerAddress: raw.manufacturerAddress,
    fssaiLicense: raw.fssaiLicense,
    hsnCode: raw.hsnCodeRef?.code ?? null,
    taxInclusive: raw.taxInclusive,
    storageInstructions: raw.storageInstructions,
    disclaimer: raw.disclaimer,
  };
}

@Injectable()
export class BuyerProductService {
  private readonly logger = new Logger(BuyerProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: BuyerCacheService,
    private readonly configService: ConfigService,
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

      const storeFssaiLicense =
        raw.find((p) => p.fssaiLicense?.trim())?.fssaiLicense ?? null;
      const compliant = raw.filter((p) => isBuyerCompliantProduct(p, storeFssaiLicense));

      const products = compliant.map((p) => ({
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

      const adjustedTotal = Math.max(0, total - (raw.length - compliant.length));
      return { products, total: adjustedTotal };
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
          hsnCodeRef: { select: { code: true } },
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              ratingAvg: true,
              ratingCount: true,
              avgPrepTimeMins: true,
              deliveryFee: true,
              minOrderAmount: true,
              storeType: true,
            },
          },
        },
      });

      if (!raw) return null;

      const storeFssaiLicense = await this.prisma.product.findFirst({
        where: { storeId: raw.storeId, fssaiLicense: { not: null } },
        select: { fssaiLicense: true },
        orderBy: { updatedAt: 'desc' },
      });

      if (
        !isBuyerCompliantProduct(raw, storeFssaiLicense?.fssaiLicense ?? raw.fssaiLicense)
      ) {
        return null;
      }

      const reviewAgg = await this.prisma.productReview.aggregate({
        where: { productId: raw.id, status: 'VISIBLE' },
        _avg: { rating: true },
        _count: { id: true },
      });

      const deliveryProvider = this.configService.get<string>('DELIVERY_PROVIDER', 'shadowfax');
      const ownFleetEnabled =
        this.configService.get<string>('ENABLE_OWN_FLEET', 'false') === 'true';

      return {
        id: raw.id,
        name: raw.name,
        slug: raw.slug,
        description: raw.description,
        brand: raw.brand,
        modelNumber: raw.modelNumber,
        warrantyMonths: raw.warrantyMonths,
        specifications: Array.isArray(raw.specifications) ? raw.specifications : null,
        imageUrls: raw.imageUrls,
        basePrice: Number(raw.basePrice),
        mrp: raw.mrp ? Number(raw.mrp) : null,
        unit: raw.unit,
        isVeg: raw.isVeg,
        tags: raw.tags,
        category: raw.category,
        variants: raw.variants.map(mapVariant),
        metadata: mapProductMetadata(raw),
        reviewSummary: {
          ratingAvg: reviewAgg._avg.rating ?? 0,
          ratingCount: reviewAgg._count.id,
        },
        returnPolicy: buildReturnPolicySummary({
          isReturnable: raw.isReturnable,
          isRefundable: raw.isRefundable,
          isReplaceable: raw.isReplaceable,
          returnWindowHours: raw.returnWindowHours,
          approvalMode: raw.approvalMode,
          proofRequired: raw.proofRequired,
          autoApproveBelowAmount: raw.autoApproveBelowAmount
            ? Number(raw.autoApproveBelowAmount)
            : null,
          returnReasons: raw.returnReasons,
          restockingFee: Number(raw.restockingFee),
          refundMethod: raw.refundMethod,
          returnPolicyText: raw.returnPolicyText,
          replacementPolicyText: raw.replacementPolicyText,
          preparedFoodPolicy: raw.preparedFoodPolicy,
          allowCustomerChangedMind: raw.allowCustomerChangedMind,
        }),
        store: {
          id: raw.store.id,
          name: raw.store.name,
          slug: raw.store.slug,
          ratingAvg: raw.store.ratingAvg ? Number(raw.store.ratingAvg) : undefined,
          ratingCount: raw.store.ratingCount,
          avgPrepTimeMins: raw.store.avgPrepTimeMins ?? undefined,
          deliveryFee: Number(raw.store.deliveryFee),
          minOrderAmount: Number(raw.store.minOrderAmount),
          deliveryPartner: resolveStoreDeliveryPartnerLabel(
            { storeType: raw.store.storeType },
            deliveryProvider,
            ownFleetEnabled,
          ),
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
      dto.productIds,
    );

    return this.cache.wrap(cacheKey, async () => {
      const where: Prisma.ProductWhereInput = {
        ...PRODUCT_VISIBLE_WHERE,
        store: STORE_VISIBLE_WHERE,
        ...(dto.storeId && { storeId: dto.storeId }),
        ...(dto.subcategoryId && { categoryId: dto.subcategoryId }),
        ...(!dto.subcategoryId && dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.q && buildProductTextSearchWhere(dto.q)),
        ...(dto.productIds?.length && { id: { in: dto.productIds } }),
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

  /** Cross-store price comparison for a single product anchor (grocery catalog only) */
  async compareProduct(productId: string, dto: CompareProductDto) {
    const menuItem = await this.prisma.restaurantMenuItem.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (menuItem) {
      throw new BadRequestException('Compare is only available for grocery products, not menu items');
    }

    const anchor = await this.getProductById(productId);
    if (!anchor) return null;

    const storeTypes = await this.prisma.storeBusinessType.findMany({
      where: { storeId: anchor.store.id, status: 'APPROVED' },
      select: { businessType: true },
    });
    const hasGroceryCatalog = storeTypes.some(
      (t) => t.businessType === 'GROCERY' || t.businessType === 'FRUITS_VEGETABLES',
    );
    if (!hasGroceryCatalog && storeTypes.length > 0) {
      throw new BadRequestException('Compare is only available for grocery products');
    }

    const { products } = await this.searchProducts({
      q: anchor.name,
      lat: dto.lat,
      lng: dto.lng,
      pincode: dto.pincode,
      limit: 50,
      page: 1,
      sort: 'price_low_high',
    });

    const normalizedUnit = anchor.unit.toLowerCase().trim();
    const storeIds = [...new Set(products.map((p) => p.store.id))];
    const storeRows =
      storeIds.length > 0
        ? await this.prisma.store.findMany({
            where: { id: { in: storeIds }, ...STORE_VISIBLE_WHERE },
            include: STORE_DISCOVERY_INCLUDE,
          })
        : [];
    const storeMap = new Map(storeRows.map((s) => [s.id, s]));
    const platformKey = this.configService.get<string>('DELIVERY_PROVIDER', 'shadowfax');
    const ownFleetEnabled =
      this.configService.get<string>('ENABLE_OWN_FLEET', 'false') === 'true';

    const offers: CompareStoreOffer[] = [];

    for (const p of products) {
      if (p.unit.toLowerCase().trim() !== normalizedUnit) continue;
      const variant = p.variants.find((v) => v.isDefault) ?? p.variants[0];
      if (!variant?.id) continue;

      const price = variant.price;
      const mrpVal = variant.mrp ?? p.mrp;
      const stock = variant.availableQty;
      const storeGeo = storeMap.get(p.store.id);

      let serviceable = true;
      let distanceKm = p.store.distanceKm ?? null;
      let deliveryFee = storeGeo ? Number(storeGeo.deliveryFee) : 0;
      let minimumOrder = storeGeo ? Number(storeGeo.minOrderAmount) : 0;
      let etaMins: number | null = p.store.avgPrepTimeMins ?? null;

      if (dto.lat != null && dto.lng != null && storeGeo) {
        const eligibility = canDeliverToBuyer(storeGeo, {
          lat: dto.lat,
          lng: dto.lng,
          pincode: dto.pincode,
          discoveryRadiusKm: DEFAULT_BUYER_DISCOVERY_RADIUS_KM,
        });
        serviceable = eligibility.eligible;
        distanceKm = eligibility.deliverable.distanceKm;
        const terms = resolveDeliveryTerms(storeGeo, dto.pincode);
        deliveryFee = terms.deliveryFee;
        minimumOrder = terms.minOrderAmount;
        etaMins =
          distanceKm != null
            ? estimateDeliveryEtaMins(distanceKm, terms.estimatedMinutes)
            : terms.estimatedMinutes;
      }

      const discount = mrpVal != null && mrpVal > price ? mrpVal - price : 0;
      const discountPercent =
        mrpVal != null && mrpVal > 0 ? Math.round((discount / mrpVal) * 100) : 0;
      const finalPayableAmount = price + (serviceable ? deliveryFee : 0);
      const deliveryPartner = storeGeo
        ? resolveStoreDeliveryPartnerLabel(
            { storeType: storeGeo.storeType },
            platformKey,
            ownFleetEnabled,
          )
        : normalizeDeliveryPartnerLabel(platformKey);

      offers.push({
        storeId: p.store.id,
        storeName: p.store.name,
        storeSlug: p.store.slug,
        productId: p.id,
        variantId: variant.id,
        price,
        offerPrice: price,
        mrp: mrpVal,
        discount,
        discountPercent,
        deliveryFee,
        minimumOrder,
        distanceKm,
        etaMins,
        rating: p.store.ratingAvg ?? null,
        stock,
        finalPayableAmount,
        serviceable,
        cheapest: false,
        deliveryPartner,
      });
    }

    return buildCompareResult(anchor, offers);
  }

  /** PDP offers bundle: promotions, coupons, delivery & membership perks */
  async getProductOffers(productId: string, userId?: string) {
    const product = await this.getProductById(productId);
    if (!product) return null;

    const now = new Date();
    const storeId = product.store.id;

    const categoryId = product.category?.id;
    const [promotions, coupons, campaignOffers, walletConfig] = await Promise.all([
      this.prisma.storePromotion.findMany({
        where: {
          storeId,
          isActive: true,
          pausedAt: null,
          startsAt: { lte: now },
          expiresAt: { gte: now },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.coupon.findMany({
        where: {
          isActive: true,
          suspendedAt: null,
          startsAt: { lte: now },
          expiresAt: { gte: now },
          OR: [{ storeId }, { scope: 'PLATFORM' }],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.offer.findMany({
        where: {
          isActive: true,
          pausedAt: null,
          startsAt: { lte: now },
          expiresAt: { gte: now },
          OR: [{ storeId }, { storeId: null }],
          AND: [
            {
              OR: [
                { productId },
                { productId: null, target: 'STORE_WIDE' },
                ...(categoryId ? [{ productId: null, categoryId }] : []),
              ],
            },
          ],
        },
        include: { campaign: { select: { id: true, name: true } } },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: 10,
      }),
      this.prisma.platformSetting.findUnique({ where: { key: 'wallet_cashback_percent' } }),
    ]);

    let plusBenefits: string[] = [];
    let walletCashbackPercent: number | null = null;
    let rewardPoints: number | null = null;
    let walletCashbackEligible = false;
    let firstOrderEligible = false;
    let personalizedOffers: {
      id: string;
      name: string;
      description: string | null;
      kind: string;
    }[] = [];

    if (userId) {
      const bp = await this.prisma.buyerProfile.findUnique({
        where: { userId },
        include: { wallet: true },
      });

      if (bp) {
        const [sub, deliveredOrders] = await Promise.all([
          this.prisma.membershipSubscription.findFirst({
            where: {
              userId,
              status: 'ACTIVE',
              expiresAt: { gt: now },
            },
            include: { plan: { include: { benefits: true } } },
          }),
          this.prisma.order.count({
            where: { buyerProfileId: bp.id, status: 'DELIVERED' },
          }),
        ]);

        plusBenefits = sub?.plan.benefits.map((b) => b.type) ?? [];
        rewardPoints = bp.wallet?.rewardPoints ?? 0;
        firstOrderEligible = deliveredOrders === 0;
        walletCashbackEligible = Number(bp.wallet?.balance ?? 0) >= 0;

        const personalized = await this.prisma.offer.findMany({
          where: {
            isActive: true,
            pausedAt: null,
            startsAt: { lte: now },
            expiresAt: { gte: now },
            OR: [{ storeId }, { storeId: null }],
          },
          include: { rules: true },
          orderBy: [{ priority: 'desc' }, { usedCount: 'desc' }],
          take: 20,
        });

        const usageCounts = await Promise.all(
          personalized.map((o) =>
            this.prisma.offerUsage.count({
              where: { offerId: o.id, buyerProfileId: bp.id },
            }),
          ),
        );

        personalizedOffers = personalized
          .filter((o, i) => usageCounts[i]! < o.perUserLimit)
          .slice(0, 5)
          .map((o) => ({
            id: o.id,
            name: o.name,
            description: o.description,
            kind: o.kind,
          }));
      }
    }

    if (walletConfig?.value && typeof walletConfig.value === 'object' && walletConfig.value !== null) {
      const pct = (walletConfig.value as { percent?: number }).percent;
      if (typeof pct === 'number') walletCashbackPercent = pct;
    }

    const deliveryFee = product.store.deliveryFee ?? 0;
    const freeDeliveryEligible =
      deliveryFee === 0 ||
      promotions.some((p) => p.offerType === 'FREE_DELIVERY') ||
      plusBenefits.includes(MembershipBenefitType.FREE_DELIVERY);

    return {
      productId,
      storePromotions: promotions.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        offerType: p.offerType,
        badge: this.promotionBadge(p),
      })),
      campaignOffers: campaignOffers.map((o) => ({
        id: o.id,
        name: o.name,
        description: o.description,
        kind: o.kind,
        campaignName: o.campaign.name,
        minOrderAmount: Number(o.minOrderAmount),
      })),
      coupons: coupons.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        minOrderAmount: Number(c.minOrderAmount),
      })),
      walletCashbackPercent,
      walletCashbackEligible,
      rewardPoints,
      firstOrderEligible,
      plusBenefits,
      personalizedOffers,
      freeDeliveryEligible,
    };
  }

  private promotionBadge(p: StorePromotion): string {
    switch (p.offerType) {
      case 'FREE_DELIVERY':
        return 'Free delivery';
      case 'PERCENTAGE_DISCOUNT':
      case 'COMBO':
        return `${Number(p.discountValue)}% off`;
      case 'FLAT_DISCOUNT':
        return `₹${Number(p.discountValue)} off`;
      case 'BUY_X_GET_Y':
        return `Buy ${p.buyQuantity ?? 2} Get ${p.getQuantity ?? 1}`;
      default:
        return 'Offer';
    }
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
