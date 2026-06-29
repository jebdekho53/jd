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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestaurantDiscoveryService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const vertical_constants_1 = require("./vertical.constants");
const delivery_eta_util_1 = require("../../common/utils/delivery-eta.util");
const buyer_visibility_util_1 = require("../buyer/buyer-visibility.util");
let RestaurantDiscoveryService = class RestaurantDiscoveryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getHomeVerticals() {
        return vertical_constants_1.BUYER_HOME_VERTICALS;
    }
    async listRestaurants(opts) {
        const page = opts.page ?? 1;
        const limit = opts.limit ?? 20;
        const foodTypes = opts.vertical
            ? [opts.vertical]
            : [
                client_1.VerticalBusinessType.RESTAURANT,
                client_1.VerticalBusinessType.CLOUD_KITCHEN,
                client_1.VerticalBusinessType.CAFE,
            ];
        const stores = await this.prisma.store.findMany({
            where: {
                status: client_1.StoreStatus.APPROVED,
                isActive: true,
                deletedAt: null,
                businessTypes: {
                    some: {
                        businessType: { in: foodTypes },
                        status: client_1.StoreBusinessTypeStatus.APPROVED,
                    },
                },
                ...(opts.cuisineSlug
                    ? {
                        restaurantProfile: {
                            cuisines: { some: { cuisine: { slug: opts.cuisineSlug } } },
                        },
                    }
                    : {}),
            },
            include: {
                restaurantProfile: { include: { cuisines: { include: { cuisine: true } } } },
                businessTypes: { where: { status: client_1.StoreBusinessTypeStatus.APPROVED } },
                deliveryAreas: { where: { isActive: true } },
                storeServiceAreas: {
                    include: {
                        serviceArea: {
                            select: { centerLat: true, centerLng: true, radiusKm: true },
                        },
                    },
                },
            },
            take: limit * 3,
            skip: (page - 1) * limit,
            orderBy: [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }],
        });
        let ranked = stores;
        if (opts.lat != null && opts.lng != null) {
            ranked = stores
                .map((s) => {
                const distanceKm = s.latitude != null && s.longitude != null
                    ? Math.round((0, delivery_eta_util_1.haversineKm)(opts.lat, opts.lng, s.latitude, s.longitude) * 100) / 100
                    : null;
                return { store: s, distanceKm };
            })
                .filter(({ store }) => (0, buyer_visibility_util_1.canDeliverToBuyer)((0, buyer_visibility_util_1.toDeliverableStoreShape)(store), {
                lat: opts.lat,
                lng: opts.lng,
                discoveryRadiusKm: buyer_visibility_util_1.DEFAULT_BUYER_DISCOVERY_RADIUS_KM,
            }).eligible)
                .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
                .slice((page - 1) * limit, page * limit)
                .map(({ store, distanceKm }) => ({ ...store, distanceKm }));
        }
        else {
            ranked = stores.slice(0, limit);
        }
        return ranked.map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            bannerUrl: s.bannerUrl,
            logoUrl: s.logoUrl,
            ratingAvg: s.ratingAvg,
            ratingCount: s.ratingCount,
            avgPrepTimeMins: s.restaurantProfile?.avgPrepTimeMins ?? s.avgPrepTimeMins,
            costForTwo: s.restaurantProfile?.costForTwo ? Number(s.restaurantProfile.costForTwo) : null,
            cuisines: s.restaurantProfile?.cuisines.map((c) => c.cuisine) ?? [],
            businessTypes: s.businessTypes.map((b) => b.businessType),
            isCloudKitchen: s.restaurantProfile?.isCloudKitchen ?? false,
            distanceKm: 'distanceKm' in s ? s.distanceKm ?? null : null,
        }));
    }
    async getRestaurantDetail(slug) {
        const store = await this.prisma.store.findFirst({
            where: { slug, isActive: true, deletedAt: null },
            include: {
                restaurantProfile: { include: { cuisines: { include: { cuisine: true } } } },
                businessTypes: { where: { status: client_1.StoreBusinessTypeStatus.APPROVED } },
                reviews: { take: 5, orderBy: { createdAt: 'desc' } },
            },
        });
        if (!store)
            throw new common_1.NotFoundException('Restaurant not found');
        const hasFood = store.businessTypes.some((b) => (0, vertical_constants_1.isFoodVertical)(b.businessType));
        if (!hasFood)
            throw new common_1.NotFoundException('Not a food restaurant');
        return {
            id: store.id,
            name: store.name,
            slug: store.slug,
            description: store.description,
            bannerUrl: store.bannerUrl,
            logoUrl: store.logoUrl,
            ratingAvg: store.ratingAvg,
            ratingCount: store.ratingCount,
            phone: store.phone,
            line1: store.line1,
            locality: store.locality,
            pincode: store.pincode,
            latitude: store.latitude,
            longitude: store.longitude,
            avgPrepTimeMins: store.restaurantProfile?.avgPrepTimeMins ?? store.avgPrepTimeMins,
            packagingFee: Number(store.restaurantProfile?.packagingFee ?? 0),
            minOrderAmount: Number(store.restaurantProfile?.minOrderAmount ?? store.minOrderAmount),
            costForTwo: store.restaurantProfile?.costForTwo ? Number(store.restaurantProfile.costForTwo) : null,
            cuisines: store.restaurantProfile?.cuisines.map((c) => c.cuisine) ?? [],
            reviews: store.reviews,
            acceptsScheduled: store.restaurantProfile?.acceptsScheduled ?? true,
        };
    }
    async listCuisines() {
        return this.prisma.cuisine.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }
};
exports.RestaurantDiscoveryService = RestaurantDiscoveryService;
exports.RestaurantDiscoveryService = RestaurantDiscoveryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RestaurantDiscoveryService);
//# sourceMappingURL=restaurant-discovery.service.js.map