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
var SearchDiscoveryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchDiscoveryService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const buyer_store_service_1 = require("../buyer/buyer-store.service");
const buyer_visibility_util_1 = require("../buyer/buyer-visibility.util");
const search_cache_service_1 = require("./search-cache.service");
const search_analytics_service_1 = require("./search-analytics.service");
const ad_serving_service_1 = require("../ads/ad-serving.service");
const seo_analytics_service_1 = require("../seo/seo-analytics.service");
const client_2 = require("@prisma/client");
const search_ranking_util_1 = require("./search-ranking.util");
const product_text_search_util_1 = require("./product-text-search.util");
const SEARCH_DISCOVERY_RADIUS_KM = buyer_visibility_util_1.DEFAULT_BUYER_DISCOVERY_RADIUS_KM;
let SearchDiscoveryService = SearchDiscoveryService_1 = class SearchDiscoveryService {
    constructor(prisma, storeService, cache, analytics, adServing, seoAnalytics) {
        this.prisma = prisma;
        this.storeService = storeService;
        this.cache = cache;
        this.analytics = analytics;
        this.adServing = adServing;
        this.seoAnalytics = seoAnalytics;
        this.logger = new common_1.Logger(SearchDiscoveryService_1.name);
    }
    async unifiedSearch(dto) {
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
            const offerStoreIds = await this.activeOfferStoreIds();
            const maxDistance = dto.lat != null ? SEARCH_DISCOVERY_RADIUS_KM : 50;
            const [productRows, storeRows, categoryRows, brandRows, menuItemRows, restaurantRows] = await Promise.all([
                tab === 'stores' || tab === 'categories' || tab === 'menu_items' || tab === 'restaurants'
                    ? []
                    : this.fetchProductCandidates(dto),
                tab === 'products' || tab === 'categories' || tab === 'menu_items' ? [] : this.fetchStoreCandidates(dto),
                tab === 'products' || tab === 'stores' || tab === 'menu_items' || tab === 'restaurants'
                    ? []
                    : this.fetchCategoryCandidates(dto),
                tab === 'stores' || tab === 'categories' || tab === 'menu_items' || tab === 'restaurants'
                    ? []
                    : this.fetchBrandCandidates(dto),
                tab === 'products' || tab === 'stores' || tab === 'categories' || tab === 'restaurants'
                    ? []
                    : this.fetchMenuItemCandidates(dto),
                tab === 'products' || tab === 'stores' || tab === 'categories' || tab === 'menu_items'
                    ? []
                    : this.fetchRestaurantCandidates(dto),
            ]);
            const maxQty = Math.max(1, ...productRows.map((p) => p.totalQty));
            const scoredProducts = productRows.map((row) => {
                const relevance = dto.q ? (0, search_ranking_util_1.textRelevanceScore)(row, dto.q) : 50;
                const distanceKm = this.productDistance(dto, row.store);
                const score = (0, search_ranking_util_1.computeHyperlocalScore)({
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
                const eta = distanceKm != null
                    ? (0, search_ranking_util_1.estimateDeliveryEtaMins)(distanceKm, row.store.avgPrepTimeMins)
                    : row.store.avgPrepTimeMins;
                return {
                    id: row.id,
                    name: row.name,
                    slug: row.slug,
                    brand: row.brand,
                    imageUrls: row.imageUrls,
                    basePrice: price,
                    mrp: row.mrp,
                    variantId: row.variantId,
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
                    inStock: row.defaultVariantQty > 0,
                    availableQty: row.defaultVariantQty,
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
                const sponsoredIds = new Set(sponsored.map((s) => s.id).filter((id) => !!id));
                products = [
                    ...sponsored.map((s) => ({ ...s, sponsored: true })),
                    ...products.filter((p) => !sponsoredIds.has(p.id)),
                ].slice(0, limit);
                for (const s of sponsored) {
                    if (s.campaignId)
                        void this.adServing.recordImpression(s.campaignId, client_2.AdPlacement.SEARCH);
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
                    eventType: totalProducts === 0 ? client_1.SearchEventType.NO_RESULT : client_1.SearchEventType.QUERY,
                    query: dto.q,
                    buyerProfileId: dto.buyerProfileId,
                    sessionId: dto.sessionId,
                    lat: dto.lat,
                    lng: dto.lng,
                    metadata: { resultCount: totalProducts },
                });
                if (dto.q)
                    void this.seoAnalytics.trackSearchKeyword(dto.q);
            }
            return {
                products,
                stores,
                categories,
                subcategories,
                brands,
                menuItems: menuItemRows.slice(0, limit),
                restaurants: restaurantRows.slice(0, limit),
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
    async suggestions(dto) {
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
                        ...buyer_visibility_util_1.PRODUCT_VISIBLE_WHERE,
                        store: buyer_visibility_util_1.STORE_VISIBLE_WHERE,
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
                        ...buyer_visibility_util_1.STORE_VISIBLE_WHERE,
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
    async trending(dto) {
        const period = dto.period ?? '7d';
        const key = this.cache.trendingKey(period, dto.lat, dto.lng);
        return this.cache.wrap(key, async () => {
            const since = this.periodSince(period);
            const [queries, cartAdds, orderTerms] = await Promise.all([
                this.analytics.getTrendingQueries(period, 12),
                this.prisma.searchEvent.groupBy({
                    by: ['query'],
                    where: {
                        eventType: client_1.SearchEventType.ADD_TO_CART,
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
            const merged = new Map();
            for (const q of queries)
                merged.set(q.query, (merged.get(q.query) ?? 0) + q.count * 3);
            for (const c of cartAdds) {
                if (c.query)
                    merged.set(c.query, (merged.get(c.query) ?? 0) + c._count.id * 2);
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
    async discoverStores(dto) {
        const sortMap = {
            nearest: 'distance',
            best_rated: 'rating',
            fast_delivery: 'fast',
            new_stores: 'new',
            offers: 'popular',
        };
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
                pincode: dto.pincode,
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
                eta: (0, search_ranking_util_1.estimateDeliveryEtaMins)(s.distanceKm, s.avgPrepTimeMins),
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
    async discoverHome(dto) {
        const key = this.cache.discoverKey(['home', dto.lat, dto.lng, dto.buyerProfileId]);
        return this.cache.wrap(key, async () => {
            const base = { lat: dto.lat, lng: dto.lng, radiusKm: 15, page: 1, limit: 8 };
            const [trendingCategories, popularNearYou, fastDelivery, topRatedStores, dealsNearYou, recommendedForYou,] = await Promise.all([
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
    async recommendations(dto) {
        const productIds = [];
        const categoryIds = [];
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
                    if (i.product.categoryId)
                        categoryIds.push(i.product.categoryId);
                }
            }
            for (const i of cart.flatMap((c) => c.items)) {
                productIds.push(i.product.id);
                if (i.product.categoryId)
                    categoryIds.push(i.product.categoryId);
            }
            const searches = await this.prisma.searchEvent.findMany({
                where: { buyerProfileId: dto.buyerProfileId, eventType: client_1.SearchEventType.QUERY },
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
    async homeTrendingCategories() {
        const since = this.periodSince('7d');
        const orderCats = await this.prisma.orderItem.findMany({
            where: { order: { createdAt: { gte: since } } },
            select: { product: { select: { category: { select: { id: true, name: true, slug: true, imageUrl: true } } } } },
            take: 200,
        });
        const counts = new Map();
        for (const row of orderCats) {
            const c = row.product.category;
            if (!c)
                continue;
            const cur = counts.get(c.id) ?? { ...c, count: 0 };
            cur.count += 1;
            counts.set(c.id, cur);
        }
        return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 8);
    }
    sortProducts(items, sort) {
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
    productDistance(dto, store) {
        if (dto.lat == null || dto.lng == null)
            return null;
        const result = (0, buyer_visibility_util_1.canDeliverToBuyer)((0, buyer_visibility_util_1.toDeliverableStoreShape)(store), {
            lat: dto.lat,
            lng: dto.lng,
            pincode: dto.pincode,
            discoveryRadiusKm: SEARCH_DISCOVERY_RADIUS_KM,
        });
        return result.deliverable.distanceKm;
    }
    isStoreEligibleForSearch(dto, store) {
        if (dto.lat == null || dto.lng == null)
            return true;
        return (0, buyer_visibility_util_1.canDeliverToBuyer)((0, buyer_visibility_util_1.toDeliverableStoreShape)(store), {
            lat: dto.lat,
            lng: dto.lng,
            pincode: dto.pincode,
            discoveryRadiusKm: SEARCH_DISCOVERY_RADIUS_KM,
        }).eligible;
    }
    async fetchProductCandidates(dto) {
        const categoryId = dto.subcategoryId ?? dto.categoryId;
        const q = dto.q?.trim();
        const where = {
            ...buyer_visibility_util_1.PRODUCT_VISIBLE_WHERE,
            store: buyer_visibility_util_1.STORE_VISIBLE_WHERE,
            ...(dto.storeId && { storeId: dto.storeId }),
            ...(categoryId && { categoryId }),
            ...(q && (0, product_text_search_util_1.buildProductTextSearchWhere)(q)),
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
            .filter((p) => Boolean(p.categoryId))
            .map((p) => {
            const qty = p.variants.reduce((s, v) => s + Math.max(0, v.inventory?.availableQty ?? 0), 0);
            const prices = p.variants.map((v) => Number(v.price));
            const minPrice = prices.length ? Math.min(...prices) : Number(p.basePrice);
            const defaultVariant = p.variants.find((v) => v.isDefault) ?? p.variants[0];
            if (!defaultVariant)
                return null;
            const defaultVariantQty = Math.max(0, defaultVariant.inventory?.availableQty ?? 0);
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
                variantId: defaultVariant.id,
                defaultVariantQty,
                minPrice,
                mrp: defaultVariant.mrp ? Number(defaultVariant.mrp) : p.mrp ? Number(p.mrp) : null,
            };
        })
            .filter((p) => p !== null)
            .filter((p) => {
            if (dto.minPrice != null && p.minPrice < dto.minPrice)
                return false;
            if (dto.maxPrice != null && p.minPrice > dto.maxPrice)
                return false;
            if (dto.lat != null && dto.lng != null) {
                return this.isStoreEligibleForSearch(dto, p.store);
            }
            return true;
        });
    }
    async fetchStoreCandidates(dto) {
        if (!dto.q || dto.lat == null || dto.lng == null)
            return [];
        const q = dto.q.toLowerCase();
        const stores = await this.prisma.store.findMany({
            where: {
                ...buyer_visibility_util_1.STORE_VISIBLE_WHERE,
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
            const eligibility = (0, buyer_visibility_util_1.canDeliverToBuyer)((0, buyer_visibility_util_1.toDeliverableStoreShape)(store), {
                lat: dto.lat,
                lng: dto.lng,
                pincode: dto.pincode,
                discoveryRadiusKm: SEARCH_DISCOVERY_RADIUS_KM,
            });
            if (!eligibility.eligible)
                return null;
            return {
                id: store.id,
                name: store.name,
                slug: store.slug,
                logoUrl: store.logoUrl,
                bannerUrl: store.bannerUrl,
                ratingAvg: store.ratingAvg,
                distanceKm: eligibility.deliverable.distanceKm ?? 0,
                etaMins: (0, search_ranking_util_1.estimateDeliveryEtaMins)(eligibility.deliverable.distanceKm ?? 0, store.avgPrepTimeMins),
                categories: categoryMap.get(store.id) ?? [],
            };
        })
            .filter((s) => s !== null)
            .sort((a, b) => a.distanceKm - b.distanceKm);
    }
    async fetchCategoryCandidates(dto) {
        if (!dto.q)
            return [];
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
    async fetchBrandCandidates(dto) {
        if (!dto.q)
            return [];
        const rows = await this.prisma.product.findMany({
            where: {
                ...buyer_visibility_util_1.PRODUCT_VISIBLE_WHERE,
                brand: { contains: dto.q, mode: 'insensitive' },
            },
            select: { brand: true },
            distinct: ['brand'],
            take: 10,
        });
        return rows.filter((r) => r.brand).map((r) => ({ name: r.brand }));
    }
    async fetchMenuItemCandidates(dto) {
        if (!dto.q || dto.q.trim().length < 2)
            return [];
        const q = dto.q.trim();
        try {
            const rows = await this.prisma.$queryRaw `
        SELECT m.id as menu_item_id, m.name, m.store_id, m.base_price, m.diet_type::text
        FROM restaurant_menu_items m
        INNER JOIN stores s ON s.id = m.store_id
        WHERE m.is_active = true
          AND m.availability = 'AVAILABLE'
          AND s.status = 'APPROVED'
          AND s.is_active = true
          AND s.deleted_at IS NULL
          AND (
            m.name ILIKE ${'%' + q + '%'}
            OR m.description ILIKE ${'%' + q + '%'}
            OR m.cuisine_name ILIKE ${'%' + q + '%'}
          )
        ORDER BY m.order_count DESC, m.rating_avg DESC
        LIMIT 20
      `;
            const storeIds = [...new Set(rows.map((r) => r.store_id))];
            const stores = await this.prisma.store.findMany({
                where: { id: { in: storeIds }, ...buyer_visibility_util_1.STORE_VISIBLE_WHERE },
                include: buyer_visibility_util_1.STORE_DISCOVERY_INCLUDE,
            });
            const storeMap = new Map(stores.map((s) => [s.id, s]));
            return rows
                .filter((r) => {
                const store = storeMap.get(r.store_id);
                if (!store)
                    return false;
                if (dto.lat == null || dto.lng == null)
                    return true;
                return (0, buyer_visibility_util_1.canDeliverToBuyer)((0, buyer_visibility_util_1.toDeliverableStoreShape)(store), {
                    lat: dto.lat,
                    lng: dto.lng,
                    pincode: dto.pincode,
                    discoveryRadiusKm: buyer_visibility_util_1.DEFAULT_BUYER_DISCOVERY_RADIUS_KM,
                }).eligible;
            })
                .map((r) => ({
                id: r.menu_item_id,
                name: r.name,
                basePrice: Number(r.base_price),
                dietType: r.diet_type,
                store: storeMap.get(r.store_id),
                type: 'menu_item',
            }));
        }
        catch {
            return [];
        }
    }
    async fetchRestaurantCandidates(dto) {
        if (!dto.q || dto.q.trim().length < 2)
            return [];
        const q = dto.q.trim();
        const stores = await this.prisma.store.findMany({
            where: {
                ...buyer_visibility_util_1.STORE_VISIBLE_WHERE,
                businessTypes: {
                    some: {
                        businessType: { in: ['RESTAURANT', 'CLOUD_KITCHEN', 'CAFE', 'BAKERY'] },
                        status: 'APPROVED',
                    },
                },
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { description: { contains: q, mode: 'insensitive' } },
                ],
            },
            include: buyer_visibility_util_1.STORE_DISCOVERY_INCLUDE,
            take: 30,
            orderBy: [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }],
        });
        const eligible = stores.filter((s) => {
            if (dto.lat == null || dto.lng == null)
                return true;
            return (0, buyer_visibility_util_1.canDeliverToBuyer)((0, buyer_visibility_util_1.toDeliverableStoreShape)(s), {
                lat: dto.lat,
                lng: dto.lng,
                pincode: dto.pincode,
                discoveryRadiusKm: buyer_visibility_util_1.DEFAULT_BUYER_DISCOVERY_RADIUS_KM,
            }).eligible;
        });
        return eligible.slice(0, 15).map((s) => ({ ...s, type: 'restaurant' }));
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
    async storeOffersMap(storeIds) {
        if (storeIds.length === 0)
            return new Map();
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
        const map = new Map();
        for (const p of promos) {
            const list = map.get(p.storeId) ?? [];
            list.push(p.name);
            map.set(p.storeId, list);
        }
        return map;
    }
    async storeCategoriesMap(storeIds) {
        if (storeIds.length === 0)
            return new Map();
        const grants = await this.prisma.storeCategory.findMany({
            where: { storeId: { in: storeIds } },
            include: { subcategory: { select: { id: true, name: true } } },
        });
        const map = new Map();
        for (const g of grants) {
            const list = map.get(g.storeId) ?? [];
            list.push({ id: g.subcategory.id, name: g.subcategory.name });
            map.set(g.storeId, list);
        }
        return map;
    }
    periodSince(period) {
        const ms = period === '24h' ? 86_400_000 : period === '7d' ? 7 * 86_400_000 : 30 * 86_400_000;
        return new Date(Date.now() - ms);
    }
    emptySearchResult(page, limit) {
        return {
            products: [],
            stores: [],
            categories: [],
            subcategories: [],
            brands: [],
            menuItems: [],
            restaurants: [],
            meta: { page, limit, totalProducts: 0, totalPages: 0, sort: 'relevance', tab: 'all' },
        };
    }
};
exports.SearchDiscoveryService = SearchDiscoveryService;
exports.SearchDiscoveryService = SearchDiscoveryService = SearchDiscoveryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        buyer_store_service_1.BuyerStoreService,
        search_cache_service_1.SearchCacheService,
        search_analytics_service_1.SearchAnalyticsService,
        ad_serving_service_1.AdServingService,
        seo_analytics_service_1.SeoAnalyticsService])
], SearchDiscoveryService);
//# sourceMappingURL=search-discovery.service.js.map