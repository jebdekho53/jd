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
var BuyerStoreService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuyerStoreService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const geospatial_util_1 = require("../../common/utils/geospatial.util");
const buyer_category_catalog_1 = require("./buyer-category-catalog");
const buyer_cache_service_1 = require("./buyer-cache.service");
const buyer_visibility_util_1 = require("./buyer-visibility.util");
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
function nowIST() {
    return new Date(Date.now() + IST_OFFSET_MS);
}
function dayOfWeekEnum(date) {
    const days = [
        client_1.DayOfWeek.SUNDAY,
        client_1.DayOfWeek.MONDAY,
        client_1.DayOfWeek.TUESDAY,
        client_1.DayOfWeek.WEDNESDAY,
        client_1.DayOfWeek.THURSDAY,
        client_1.DayOfWeek.FRIDAY,
        client_1.DayOfWeek.SATURDAY,
    ];
    return days[date.getDay()];
}
function timeToMinutes(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
}
let BuyerStoreService = BuyerStoreService_1 = class BuyerStoreService {
    constructor(prisma, cache) {
        this.prisma = prisma;
        this.cache = cache;
        this.logger = new common_1.Logger(BuyerStoreService_1.name);
    }
    async discoverStores(dto) {
        const { lat, lng, radiusKm = 5, page = 1, limit = 20, sort = 'distance', pincode } = dto;
        const cacheKey = buyer_cache_service_1.BUYER_CACHE_KEYS.storeDiscovery(lat, lng, radiusKm, page, limit, sort, pincode);
        return this.cache.wrap(cacheKey, async () => {
            const latDelta = radiusKm / 111;
            const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
            const visibleWhere = buyer_visibility_util_1.STORE_VISIBLE_WHERE;
            const storeInclude = buyer_visibility_util_1.STORE_DISCOVERY_INCLUDE;
            const pincodeQuery = pincode && /^\d{6}$/.test(pincode)
                ? this.prisma.store.findMany({
                    where: {
                        ...visibleWhere,
                        deliveryAreas: { some: { pincode, isActive: true } },
                    },
                    include: storeInclude,
                })
                : Promise.resolve([]);
            const [byLocation, byServiceArea, byPincode] = await Promise.all([
                this.prisma.store.findMany({
                    where: {
                        ...visibleWhere,
                        latitude: { gte: lat - latDelta, lte: lat + latDelta },
                        longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
                    },
                    include: storeInclude,
                }),
                this.prisma.store.findMany({
                    where: {
                        ...visibleWhere,
                        storeServiceAreas: {
                            some: {
                                serviceArea: {
                                    centerLat: { gte: lat - latDelta, lte: lat + latDelta },
                                    centerLng: { gte: lng - lngDelta, lte: lng + lngDelta },
                                },
                            },
                        },
                    },
                    include: storeInclude,
                }),
                pincodeQuery,
            ]);
            const candidateMap = new Map();
            for (const store of [...byLocation, ...byServiceArea, ...byPincode]) {
                candidateMap.set(store.id, store);
            }
            const now = nowIST();
            const todayEnum = dayOfWeekEnum(now);
            const nowMins = now.getHours() * 60 + now.getMinutes();
            const enriched = [...candidateMap.values()]
                .map((store) => {
                const eligibility = (0, buyer_visibility_util_1.canDeliverToBuyer)(store, {
                    lat,
                    lng,
                    pincode,
                    discoveryRadiusKm: radiusKm,
                });
                if (!eligibility.eligible)
                    return null;
                const terms = (0, buyer_visibility_util_1.resolveBuyerDeliveryTerms)(store, pincode);
                const todayHour = store.hours.find((h) => h.dayOfWeek === todayEnum) ?? null;
                const isOpen = computeIsOpen(todayHour, nowMins);
                const stats = store.reputationStats;
                const reputationScore = stats?.rankingScore ??
                    store.ratingAvg * Math.log10(store.ratingCount + 2);
                return {
                    card: {
                        id: store.id,
                        name: store.name,
                        slug: store.slug,
                        logoUrl: store.logoUrl,
                        bannerUrl: store.bannerUrl,
                        description: store.description,
                        address: { line1: store.line1, line2: store.line2, pincode: store.pincode },
                        ratingAvg: store.ratingAvg,
                        ratingCount: store.ratingCount,
                        deliveryFee: terms.deliveryFee,
                        minOrderAmount: terms.minOrderAmount,
                        avgPrepTimeMins: terms.estimatedMinutes,
                        distanceKm: eligibility.deliverable.distanceKm ?? 0,
                        isOpen,
                        todayHours: todayHour && !todayHour.isClosed
                            ? { openTime: todayHour.openTime, closeTime: todayHour.closeTime }
                            : null,
                    },
                    createdAt: store.createdAt,
                    reputationScore,
                };
            })
                .filter((s) => s !== null);
            const sorted = sortStoreCards(enriched, sort);
            const total = sorted.length;
            const stores = sorted.slice((page - 1) * limit, page * limit).map((s) => s.card);
            this.logger.log(`discoverStores lat=${lat} lng=${lng} radiusKm=${radiusKm} → ${total} deliverable (${stores.length} on page ${page})`);
            return { stores, total };
        });
    }
    async listStoresForCategory(categoryId, dto) {
        const { lat, lng, radiusKm = 5, page = 1, limit = 20, subcategoryId, sort = 'distance', pincode } = dto;
        const storeCounts = await (0, buyer_category_catalog_1.fetchStoresForCategory)(this.prisma, categoryId, subcategoryId);
        this.logger.debug(`listStoresForCategory categoryId=${categoryId} pincode=${pincode ?? '—'} ` +
            `productStores=${storeCounts.length} [${storeCounts.map((s) => s.storeId).join(',')}]`);
        if (storeCounts.length === 0)
            return { stores: [], total: 0 };
        const countMap = new Map(storeCounts.map((s) => [s.storeId, s.productCount]));
        const categoryStores = await this.prisma.store.findMany({
            where: {
                id: { in: [...countMap.keys()] },
                ...buyer_visibility_util_1.STORE_VISIBLE_WHERE,
            },
            include: buyer_visibility_util_1.STORE_DISCOVERY_INCLUDE,
        });
        const now = nowIST();
        const todayEnum = dayOfWeekEnum(now);
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const enriched = categoryStores
            .map((store) => {
            const eligibility = (0, buyer_visibility_util_1.canDeliverToBuyer)(store, {
                lat,
                lng,
                pincode,
                discoveryRadiusKm: radiusKm,
            });
            this.logger.debug(`Store ${store.slug} | Distance ${eligibility.deliverable.distanceKm ?? '—'} km | ` +
                `Buyer pincode ${pincode ?? '—'} | Matched delivery area ${eligibility.pincodeMatch ? 'YES' : 'NO'} | ` +
                `Included ${eligibility.eligible ? 'YES' : 'NO'} | ` +
                `Reason ${eligibility.filterReason ?? 'ok'}`);
            if (!eligibility.eligible)
                return null;
            const terms = (0, buyer_visibility_util_1.resolveBuyerDeliveryTerms)(store, pincode);
            const todayHour = store.hours.find((h) => h.dayOfWeek === todayEnum) ?? null;
            const isOpen = computeIsOpen(todayHour, nowMins);
            const stats = store.reputationStats;
            const reputationScore = stats?.rankingScore ?? store.ratingAvg * Math.log10(store.ratingCount + 2);
            return {
                card: {
                    id: store.id,
                    name: store.name,
                    slug: store.slug,
                    logoUrl: store.logoUrl,
                    bannerUrl: store.bannerUrl,
                    description: store.description,
                    address: { line1: store.line1, line2: store.line2, pincode: store.pincode },
                    ratingAvg: store.ratingAvg,
                    ratingCount: store.ratingCount,
                    deliveryFee: terms.deliveryFee,
                    minOrderAmount: terms.minOrderAmount,
                    avgPrepTimeMins: terms.estimatedMinutes,
                    distanceKm: eligibility.deliverable.distanceKm ?? 0,
                    isOpen,
                    todayHours: todayHour && !todayHour.isClosed
                        ? { openTime: todayHour.openTime, closeTime: todayHour.closeTime }
                        : null,
                    productCount: countMap.get(store.id) ?? 0,
                },
                createdAt: store.createdAt,
                reputationScore,
            };
        })
            .filter((s) => s !== null);
        const sorted = sortStoreCards(enriched, sort);
        const total = sorted.length;
        const stores = sorted
            .slice((page - 1) * limit, page * limit)
            .map((s) => s.card);
        this.logger.log(`listStoresForCategory categoryId=${categoryId} subcategoryId=${subcategoryId ?? '—'} → ${total} deliverable (${stores.length} on page ${page})`);
        return { stores, total };
    }
    async getStoreBySlug(slug) {
        const cacheKey = buyer_cache_service_1.BUYER_CACHE_KEYS.storeDetail(slug);
        return this.cache.wrap(cacheKey, async () => {
            const store = await this.prisma.store.findFirst({
                where: {
                    slug,
                    status: client_1.StoreStatus.APPROVED,
                    isActive: true,
                    deletedAt: null,
                },
                include: {
                    hours: { orderBy: { dayOfWeek: 'asc' } },
                    storeServiceAreas: {
                        include: {
                            serviceArea: { select: { id: true, name: true, pincode: true, radiusKm: true } },
                        },
                    },
                    verificationDocuments: { select: { documentType: true } },
                    merchantProfile: {
                        select: { kycStatus: true, gstNumber: true, createdAt: true },
                    },
                    _count: {
                        select: {
                            products: {
                                where: { isActive: true, deletedAt: null },
                            },
                        },
                    },
                },
            });
            if (!store)
                throw new common_1.NotFoundException(`Store not found: ${slug}`);
            const storeCategories = await (0, buyer_category_catalog_1.fetchStoreVisibleCategories)(this.prisma, store.id);
            const categoryRows = storeCategories.flatMap((parent) => parent.children.length > 0
                ? parent.children.map((ch) => ({ id: ch.id, name: ch.name, slug: ch.slug }))
                : [{ id: parent.id, name: parent.name, slug: parent.slug }]);
            const docTypes = new Set(store.verificationDocuments.map((d) => d.documentType));
            const deliveryRadiusKm = (0, geospatial_util_1.normalizeDeliveryRadiusKm)(store.deliveryRadiusKm);
            const now = nowIST();
            const todayEnum = dayOfWeekEnum(now);
            const nowMins = now.getHours() * 60 + now.getMinutes();
            const todayHour = store.hours.find((h) => h.dayOfWeek === todayEnum) ?? null;
            const isOpen = computeIsOpen(todayHour, nowMins);
            return {
                id: store.id,
                name: store.name,
                slug: store.slug,
                logoUrl: store.logoUrl,
                bannerUrl: store.bannerUrl,
                description: store.description,
                phone: store.phone,
                email: store.email,
                address: { line1: store.line1, line2: store.line2, pincode: store.pincode },
                ratingAvg: store.ratingAvg,
                ratingCount: store.ratingCount,
                deliveryFee: Number(store.deliveryFee),
                minOrderAmount: Number(store.minOrderAmount),
                avgPrepTimeMins: store.avgPrepTimeMins,
                distanceKm: 0,
                isOpen,
                todayHours: todayHour && !todayHour.isClosed
                    ? { openTime: todayHour.openTime, closeTime: todayHour.closeTime }
                    : null,
                hours: store.hours.map((h) => ({
                    day: h.dayOfWeek,
                    openTime: h.openTime,
                    closeTime: h.closeTime,
                    isClosed: h.isClosed,
                })),
                serviceAreas: store.storeServiceAreas.map((ssa) => ({
                    id: ssa.serviceArea.id,
                    name: ssa.serviceArea.name,
                    pincode: ssa.serviceArea.pincode,
                })),
                categories: categoryRows,
                productCount: store._count.products,
                verifications: {
                    gst: Boolean(store.merchantProfile.gstNumber) || docTypes.has(client_1.StoreDocumentType.GST_CERTIFICATE),
                    kyc: store.merchantProfile.kycStatus === 'APPROVED',
                    fssai: docTypes.has(client_1.StoreDocumentType.FSSAI_LICENSE),
                },
                merchantSince: store.merchantProfile.createdAt.toISOString(),
                deliveryRadiusKm,
            };
        });
    }
};
exports.BuyerStoreService = BuyerStoreService;
exports.BuyerStoreService = BuyerStoreService = BuyerStoreService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        buyer_cache_service_1.BuyerCacheService])
], BuyerStoreService);
function computeIsOpen(hour, nowMins) {
    if (!hour || hour.isClosed)
        return false;
    const open = timeToMinutes(hour.openTime);
    const close = timeToMinutes(hour.closeTime);
    if (close < open) {
        return nowMins >= open || nowMins < close;
    }
    return nowMins >= open && nowMins < close;
}
function sortStoreCards(stores, sort) {
    const copy = [...stores];
    switch (sort) {
        case 'popular':
            return copy.sort((a, b) => b.reputationScore - a.reputationScore);
        case 'fast':
            return copy.sort((a, b) => a.card.avgPrepTimeMins - b.card.avgPrepTimeMins);
        case 'rating':
            return copy.sort((a, b) => b.card.ratingAvg - a.card.ratingAvg || b.card.ratingCount - a.card.ratingCount);
        case 'new':
            return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        case 'distance':
        default:
            return copy.sort((a, b) => a.card.distanceKm - b.card.distanceKm);
    }
}
//# sourceMappingURL=buyer-store.service.js.map