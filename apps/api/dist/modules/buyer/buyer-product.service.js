"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BuyerProductService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuyerProductService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const buyer_category_catalog_1 = require("./buyer-category-catalog");
const buyer_cache_service_1 = require("./buyer-cache.service");
const compare_product_util_1 = require("./compare-product.util");
const search_ranking_util_1 = require("../search-discovery/search-ranking.util");
const product_text_search_util_1 = require("../search-discovery/product-text-search.util");
const buyer_visibility_util_1 = require("./buyer-visibility.util");
const delivery_coverage_util_1 = require("../../common/utils/delivery-coverage.util");
const logistics_label_util_1 = require("./logistics-label.util");
const product_return_policy_util_1 = require("../../common/utils/product-return-policy.util");
const product_compliance_util_1 = require("../../common/utils/product-compliance.util");
const config_1 = require("@nestjs/config");
async function fetchStoreProductCategoryIds(prisma, storeId) {
    const rows = await prisma.product.findMany({
        where: { storeId, ...buyer_visibility_util_1.PRODUCT_VISIBLE_WHERE, categoryId: { not: null } },
        select: { categoryId: true },
        distinct: ['categoryId'],
    });
    return rows.map((r) => r.categoryId).filter(Boolean);
}
function isBuyerCompliantProduct(product, storeFssaiLicense) {
    return !(0, product_compliance_util_1.hasProductBuyerComplianceGaps)({
        imageUrls: product.imageUrls,
        categoryId: product.categoryId,
        category: product.category,
        hsnCodeId: product.hsnCodeId,
        fssaiLicense: product.fssaiLicense,
        taxCategory: product.taxCategory,
        storeFssaiLicense,
    });
}
function mapVariant(v) {
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
function mapProductMetadata(raw) {
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
let BuyerProductService = BuyerProductService_1 = class BuyerProductService {
    constructor(prisma, cache, configService) {
        this.prisma = prisma;
        this.cache = cache;
        this.configService = configService;
        this.logger = new common_1.Logger(BuyerProductService_1.name);
    }
    async listStoreProducts(storeId, dto) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        if (dto.categoryId) {
            await this.assertCategoryInCatalog(dto.categoryId);
        }
        const cacheKey = buyer_cache_service_1.BUYER_CACHE_KEYS.storeProducts(storeId, dto.categoryId, page, limit);
        return this.cache.wrap(cacheKey, async () => {
            const productCategoryIds = await fetchStoreProductCategoryIds(this.prisma, storeId);
            if (productCategoryIds.length === 0) {
                return { products: [], total: 0 };
            }
            if (dto.categoryId && !productCategoryIds.includes(dto.categoryId)) {
                return { products: [], total: 0 };
            }
            const where = {
                ...buyer_visibility_util_1.PRODUCT_VISIBLE_WHERE,
                storeId,
                store: buyer_visibility_util_1.STORE_VISIBLE_WHERE,
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
            const storeFssaiLicense = raw.find((p) => p.fssaiLicense?.trim())?.fssaiLicense ?? null;
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
            }));
            const adjustedTotal = Math.max(0, total - (raw.length - compliant.length));
            return { products, total: adjustedTotal };
        });
    }
    async getProductById(productId, storeSlug) {
        const cacheKey = buyer_cache_service_1.BUYER_CACHE_KEYS.productDetail(productId, storeSlug);
        return this.cache.wrap(cacheKey, async () => {
            const storeWhere = storeSlug
                ? { ...buyer_visibility_util_1.STORE_VISIBLE_WHERE, slug: storeSlug }
                : buyer_visibility_util_1.STORE_VISIBLE_WHERE;
            const raw = await this.prisma.product.findFirst({
                where: {
                    ...buyer_visibility_util_1.PRODUCT_VISIBLE_WHERE,
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
            if (!raw)
                return null;
            const storeFssaiLicense = await this.prisma.product.findFirst({
                where: { storeId: raw.storeId, fssaiLicense: { not: null } },
                select: { fssaiLicense: true },
                orderBy: { updatedAt: 'desc' },
            });
            if (!isBuyerCompliantProduct(raw, storeFssaiLicense?.fssaiLicense ?? raw.fssaiLicense)) {
                return null;
            }
            const reviewAgg = await this.prisma.productReview.aggregate({
                where: { productId: raw.id, status: 'VISIBLE' },
                _avg: { rating: true },
                _count: { id: true },
            });
            const deliveryProvider = this.configService.get('DELIVERY_PROVIDER', 'shadowfax');
            const ownFleetEnabled = this.configService.get('ENABLE_OWN_FLEET', 'false') === 'true';
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
                metadata: mapProductMetadata(raw),
                reviewSummary: {
                    ratingAvg: reviewAgg._avg.rating ?? 0,
                    ratingCount: reviewAgg._count.id,
                },
                returnPolicy: (0, product_return_policy_util_1.buildReturnPolicySummary)({
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
                    deliveryPartner: (0, logistics_label_util_1.resolveStoreDeliveryPartnerLabel)({ storeType: raw.store.storeType }, deliveryProvider, ownFleetEnabled),
                },
            };
        });
    }
    async searchProducts(dto) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const effectiveCategoryId = dto.subcategoryId ?? dto.categoryId;
        if (effectiveCategoryId) {
            await this.assertCategoryInCatalog(effectiveCategoryId);
        }
        const cacheKey = buyer_cache_service_1.BUYER_CACHE_KEYS.productSearch(dto.q, dto.categoryId, dto.subcategoryId, dto.storeId, page, limit);
        return this.cache.wrap(cacheKey, async () => {
            const where = {
                ...buyer_visibility_util_1.PRODUCT_VISIBLE_WHERE,
                store: buyer_visibility_util_1.STORE_VISIBLE_WHERE,
                ...(dto.storeId && { storeId: dto.storeId }),
                ...(dto.subcategoryId && { categoryId: dto.subcategoryId }),
                ...(!dto.subcategoryId && dto.categoryId && { categoryId: dto.categoryId }),
                ...(dto.q && (0, product_text_search_util_1.buildProductTextSearchWhere)(dto.q)),
            };
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
            const discoveryRadiusKm = buyer_visibility_util_1.DEFAULT_BUYER_DISCOVERY_RADIUS_KM;
            const storeIds = [...new Set(raw.map((p) => p.storeId))];
            const storeGeoRows = storeIds.length > 0 && dto.lat != null && dto.lng != null
                ? await this.prisma.store.findMany({
                    where: { id: { in: storeIds }, ...buyer_visibility_util_1.STORE_VISIBLE_WHERE },
                    include: buyer_visibility_util_1.STORE_DISCOVERY_INCLUDE,
                })
                : [];
            const storeGeoMap = new Map(storeGeoRows.map((s) => [s.id, s]));
            const offerStoreIds = await this.activeOfferStoreIds();
            const maxQty = Math.max(1, ...raw.map((p) => p.variants.reduce((s, v) => s + Math.max(0, v.inventory?.availableQty ?? 0), 0)));
            const scored = raw.map((p) => {
                const totalQty = p.variants.reduce((s, v) => s + Math.max(0, v.inventory?.availableQty ?? 0), 0);
                const prices = p.variants.map((v) => Number(v.price));
                const minPrice = prices.length ? Math.min(...prices) : Number(p.basePrice);
                if (dto.minPrice != null && minPrice < dto.minPrice)
                    return null;
                if (dto.maxPrice != null && minPrice > dto.maxPrice)
                    return null;
                let distanceKm = null;
                if (dto.lat != null && dto.lng != null) {
                    const storeGeo = storeGeoMap.get(p.storeId);
                    if (!storeGeo)
                        return null;
                    const eligibility = (0, buyer_visibility_util_1.canDeliverToBuyer)(storeGeo, {
                        lat: dto.lat,
                        lng: dto.lng,
                        pincode: dto.pincode,
                        discoveryRadiusKm,
                    });
                    if (!eligibility.eligible)
                        return null;
                    distanceKm = eligibility.deliverable.distanceKm;
                }
                const relevance = dto.q ? (0, search_ranking_util_1.textRelevanceScore)(p, dto.q) : 50;
                const hyperScore = (0, search_ranking_util_1.computeHyperlocalScore)({
                    relevance,
                    distanceKm,
                    maxDistanceKm: buyer_visibility_util_1.DEFAULT_BUYER_DISCOVERY_RADIUS_KM,
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
                    eta: distanceKm != null
                        ? (0, search_ranking_util_1.estimateDeliveryEtaMins)(distanceKm, p.store.avgPrepTimeMins)
                        : p.store.avgPrepTimeMins,
                };
            }).filter((x) => x !== null);
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
            }));
            return { products, total };
        });
    }
    async searchProductsGrouped(dto) {
        const { products, total } = await this.searchProducts({ ...dto, limit: 100, page: 1 });
        const byStore = new Map();
        for (const product of products) {
            const existing = byStore.get(product.store.id);
            const { store, ...rest } = product;
            if (existing) {
                existing.products.push(rest);
                existing.productCount += 1;
            }
            else {
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
    async listCategories(storeId) {
        const cacheKey = buyer_cache_service_1.BUYER_CACHE_KEYS.categories(storeId);
        return this.cache.wrap(cacheKey, async () => {
            if (storeId) {
                const store = await this.prisma.store.findFirst({
                    where: { id: storeId, deletedAt: null, ...buyer_visibility_util_1.STORE_VISIBLE_WHERE },
                    select: { id: true },
                });
                if (!store) {
                    this.logger.debug(`listCategories: store ${storeId} not visible — returning []`);
                    return [];
                }
                const categories = await (0, buyer_category_catalog_1.fetchStoreVisibleCategories)(this.prisma, storeId);
                this.logger.log(`listCategories storeId=${storeId} → ${categories.length} store-visible categories`);
                return categories;
            }
            const categories = await (0, buyer_category_catalog_1.fetchActiveGlobalCategories)(this.prisma);
            this.logger.log(`listCategories storeId=${storeId ?? 'global'} → ${categories.length} active global categories`);
            return categories;
        });
    }
    async compareProduct(productId, dto) {
        const menuItem = await this.prisma.restaurantMenuItem.findUnique({
            where: { id: productId },
            select: { id: true },
        });
        if (menuItem) {
            throw new common_1.BadRequestException('Compare is only available for grocery products, not menu items');
        }
        const anchor = await this.getProductById(productId);
        if (!anchor)
            return null;
        const storeTypes = await this.prisma.storeBusinessType.findMany({
            where: { storeId: anchor.store.id, status: 'APPROVED' },
            select: { businessType: true },
        });
        const hasGroceryCatalog = storeTypes.some((t) => t.businessType === 'GROCERY' || t.businessType === 'FRUITS_VEGETABLES');
        if (!hasGroceryCatalog && storeTypes.length > 0) {
            throw new common_1.BadRequestException('Compare is only available for grocery products');
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
        const storeRows = storeIds.length > 0
            ? await this.prisma.store.findMany({
                where: { id: { in: storeIds }, ...buyer_visibility_util_1.STORE_VISIBLE_WHERE },
                include: buyer_visibility_util_1.STORE_DISCOVERY_INCLUDE,
            })
            : [];
        const storeMap = new Map(storeRows.map((s) => [s.id, s]));
        const platformKey = this.configService.get('DELIVERY_PROVIDER', 'shadowfax');
        const ownFleetEnabled = this.configService.get('ENABLE_OWN_FLEET', 'false') === 'true';
        const offers = [];
        for (const p of products) {
            if (p.unit.toLowerCase().trim() !== normalizedUnit)
                continue;
            const variant = p.variants.find((v) => v.isDefault) ?? p.variants[0];
            if (!variant?.id)
                continue;
            const price = variant.price;
            const mrpVal = variant.mrp ?? p.mrp;
            const stock = variant.availableQty;
            const storeGeo = storeMap.get(p.store.id);
            let serviceable = true;
            let distanceKm = p.store.distanceKm ?? null;
            let deliveryFee = storeGeo ? Number(storeGeo.deliveryFee) : 0;
            let minimumOrder = storeGeo ? Number(storeGeo.minOrderAmount) : 0;
            let etaMins = p.store.avgPrepTimeMins ?? null;
            if (dto.lat != null && dto.lng != null && storeGeo) {
                const eligibility = (0, buyer_visibility_util_1.canDeliverToBuyer)(storeGeo, {
                    lat: dto.lat,
                    lng: dto.lng,
                    pincode: dto.pincode,
                    discoveryRadiusKm: buyer_visibility_util_1.DEFAULT_BUYER_DISCOVERY_RADIUS_KM,
                });
                serviceable = eligibility.eligible;
                distanceKm = eligibility.deliverable.distanceKm;
                const terms = (0, delivery_coverage_util_1.resolveDeliveryTerms)(storeGeo, dto.pincode);
                deliveryFee = terms.deliveryFee;
                minimumOrder = terms.minOrderAmount;
                etaMins =
                    distanceKm != null
                        ? (0, search_ranking_util_1.estimateDeliveryEtaMins)(distanceKm, terms.estimatedMinutes)
                        : terms.estimatedMinutes;
            }
            const discount = mrpVal != null && mrpVal > price ? mrpVal - price : 0;
            const discountPercent = mrpVal != null && mrpVal > 0 ? Math.round((discount / mrpVal) * 100) : 0;
            const finalPayableAmount = price + (serviceable ? deliveryFee : 0);
            const deliveryPartner = storeGeo
                ? (0, logistics_label_util_1.resolveStoreDeliveryPartnerLabel)({ storeType: storeGeo.storeType }, platformKey, ownFleetEnabled)
                : (0, logistics_label_util_1.normalizeDeliveryPartnerLabel)(platformKey);
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
        return (0, compare_product_util_1.buildCompareResult)(anchor, offers);
    }
    async getProductOffers(productId, userId) {
        const product = await this.getProductById(productId);
        if (!product)
            return null;
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
        let plusBenefits = [];
        let walletCashbackPercent = null;
        let rewardPoints = null;
        let walletCashbackEligible = false;
        let firstOrderEligible = false;
        let personalizedOffers = [];
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
                const usageCounts = await Promise.all(personalized.map((o) => this.prisma.offerUsage.count({
                    where: { offerId: o.id, buyerProfileId: bp.id },
                })));
                personalizedOffers = personalized
                    .filter((o, i) => usageCounts[i] < o.perUserLimit)
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
            const pct = walletConfig.value.percent;
            if (typeof pct === 'number')
                walletCashbackPercent = pct;
        }
        const deliveryFee = product.store.deliveryFee ?? 0;
        const freeDeliveryEligible = deliveryFee === 0 ||
            promotions.some((p) => p.offerType === 'FREE_DELIVERY') ||
            plusBenefits.includes(client_1.MembershipBenefitType.FREE_DELIVERY);
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
    promotionBadge(p) {
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
    async assertCategoryInCatalog(categoryId) {
        try {
            await (0, buyer_category_catalog_1.assertActiveGlobalCategory)(this.prisma, categoryId);
        }
        catch {
            throw new common_1.BadRequestException('Category is not available');
        }
    }
    async activeOfferStoreIds() {
        const now = new Date();
        const promos = await this.prisma.storePromotion.findMany({
            where: { isActive: true, expiresAt: { gt: now }, startsAt: { lte: now } },
            select: { storeId: true },
            distinct: ['storeId'],
        });
        return new Set(promos.map((p) => p.storeId));
    }
    sortScoredProducts(items, sort) {
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
};
exports.BuyerProductService = BuyerProductService;
exports.BuyerProductService = BuyerProductService = BuyerProductService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        buyer_cache_service_1.BuyerCacheService,
        config_1.ConfigService])
], BuyerProductService);
//# sourceMappingURL=buyer-product.service.js.map