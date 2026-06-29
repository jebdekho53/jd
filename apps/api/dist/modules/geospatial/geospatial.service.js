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
exports.GeospatialService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const buyer_cache_service_1 = require("../buyer/buyer-cache.service");
const delivery_tracking_service_1 = require("../delivery-tracking/delivery-tracking.service");
const rider_clustering_service_1 = require("../fleet-os/rider-clustering.service");
const batching_service_1 = require("../fleet-os/batching.service");
const fleet_alert_service_1 = require("../fleet-os/fleet-alert.service");
const hotspot_service_1 = require("../ai-commerce/hotspot.service");
const location_directory_service_1 = require("../location-directory/location-directory.service");
const rider_assignment_util_1 = require("../rider-assignment/rider-assignment.util");
const geospatial_util_1 = require("../../common/utils/geospatial.util");
const store_geo_include_1 = require("../../common/constants/store-geo.include");
const buyer_visibility_util_1 = require("../buyer/buyer-visibility.util");
let GeospatialService = class GeospatialService {
    constructor(prisma, buyerCache, tracking, clusters, batching, fleetAlerts, hotspots, locations) {
        this.prisma = prisma;
        this.buyerCache = buyerCache;
        this.tracking = tracking;
        this.clusters = clusters;
        this.batching = batching;
        this.fleetAlerts = fleetAlerts;
        this.hotspots = hotspots;
        this.locations = locations;
    }
    async checkDeliverability(dto) {
        const store = await this.prisma.store.findFirst({
            where: {
                id: dto.storeId,
                status: client_1.StoreStatus.APPROVED,
                isActive: true,
                deletedAt: null,
            },
            include: store_geo_include_1.STORE_GEO_INCLUDE,
        });
        if (!store)
            throw new common_1.NotFoundException('Store not found');
        const eligibility = (0, buyer_visibility_util_1.canDeliverToBuyer)((0, buyer_visibility_util_1.toDeliverableStoreShape)(store), {
            lat: dto.lat,
            lng: dto.lng,
            pincode: dto.pincode,
            discoveryRadiusKm: buyer_visibility_util_1.UNLIMITED_DISCOVERY_RADIUS_KM,
        });
        const result = eligibility.deliverable;
        const etaMins = result.deliverable
            ? (0, geospatial_util_1.estimateStoreToBuyerEta)(store.latitude, store.longitude, dto.lat, dto.lng, store.avgPrepTimeMins, result.effectiveRadiusKm)
            : null;
        let nearestStores = [];
        if (!result.deliverable) {
            nearestStores = await this.findNearestStores(dto.lat, dto.lng, 5, dto.storeId);
        }
        return {
            deliverable: result.deliverable,
            distanceKm: result.distanceKm,
            deliveryRadiusKm: result.effectiveRadiusKm,
            etaMins,
            reason: result.reason,
            nearestStores,
        };
    }
    async findNearestStores(lat, lng, limit = 5, excludeStoreId) {
        const latDelta = 0.2;
        const lngDelta = 0.2;
        const stores = await this.prisma.store.findMany({
            where: {
                status: client_1.StoreStatus.APPROVED,
                isActive: true,
                deletedAt: null,
                ...(excludeStoreId && { id: { not: excludeStoreId } }),
                latitude: { gte: lat - latDelta, lte: lat + latDelta },
                longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
            },
            include: store_geo_include_1.STORE_GEO_INCLUDE,
            take: 50,
        });
        return stores
            .map((store) => {
            const eligibility = (0, buyer_visibility_util_1.canDeliverToBuyer)((0, buyer_visibility_util_1.toDeliverableStoreShape)(store), {
                lat,
                lng,
                discoveryRadiusKm: buyer_visibility_util_1.UNLIMITED_DISCOVERY_RADIUS_KM,
            });
            if (!eligibility.eligible)
                return null;
            const d = eligibility.deliverable;
            return {
                id: store.id,
                name: store.name,
                slug: store.slug,
                logoUrl: store.logoUrl,
                distanceKm: d.distanceKm,
                ratingAvg: store.ratingAvg,
                deliveryRadiusKm: d.effectiveRadiusKm,
                etaMins: (0, geospatial_util_1.estimateStoreToBuyerEta)(store.latitude, store.longitude, lat, lng, store.avgPrepTimeMins, d.effectiveRadiusKm),
            };
        })
            .filter((s) => s !== null)
            .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
            .slice(0, limit);
    }
    async getMapStores(lat, lng, radiusKm = 10) {
        const latDelta = radiusKm / 111;
        const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
        const now = new Date();
        const stores = await this.prisma.store.findMany({
            where: {
                status: client_1.StoreStatus.APPROVED,
                isActive: true,
                deletedAt: null,
                latitude: { gte: lat - latDelta, lte: lat + latDelta },
                longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
            },
            include: {
                ...store_geo_include_1.STORE_GEO_INCLUDE,
                storePromotions: {
                    where: {
                        isActive: true,
                        pausedAt: null,
                        startsAt: { lte: now },
                        expiresAt: { gte: now },
                    },
                    take: 1,
                    select: { id: true, name: true, offerType: true },
                },
                storeCategories: {
                    take: 2,
                    include: { category: { select: { name: true } } },
                },
            },
            take: 100,
        });
        return stores
            .map((store) => {
            const eligibility = (0, buyer_visibility_util_1.canDeliverToBuyer)((0, buyer_visibility_util_1.toDeliverableStoreShape)(store), {
                lat,
                lng,
                discoveryRadiusKm: radiusKm,
            });
            if (!eligibility.eligible)
                return null;
            const d = eligibility.deliverable;
            return {
                id: store.id,
                name: store.name,
                slug: store.slug,
                logoUrl: store.logoUrl,
                lat: store.latitude,
                lng: store.longitude,
                distanceKm: d.distanceKm,
                ratingAvg: store.ratingAvg,
                ratingCount: store.ratingCount,
                deliveryRadiusKm: d.effectiveRadiusKm,
                locality: store.locality,
                city: store.city.name,
                categories: store.storeCategories.map((sc) => sc.category.name),
                offer: store.storePromotions[0] ?? null,
                etaMins: (0, geospatial_util_1.estimateStoreToBuyerEta)(store.latitude, store.longitude, lat, lng, store.avgPrepTimeMins, d.effectiveRadiusKm),
            };
        })
            .filter((s) => s !== null)
            .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }
    async validateCheckoutLocation(storeId, lat, lng, buyerPincode) {
        const store = await this.prisma.store.findFirst({
            where: {
                id: storeId,
                status: client_1.StoreStatus.APPROVED,
                isActive: true,
                deletedAt: null,
            },
            include: {
                storeServiceAreas: { include: { serviceArea: true } },
                deliveryAreas: {
                    where: { isActive: true },
                    select: {
                        pincode: true,
                        isActive: true,
                        deliveryFee: true,
                        minimumOrder: true,
                        estimatedMinutes: true,
                        priority: true,
                    },
                },
            },
        });
        if (!store)
            throw new common_1.BadRequestException('Store is no longer accepting orders');
        const eligibility = (0, buyer_visibility_util_1.canDeliverToBuyer)((0, buyer_visibility_util_1.toDeliverableStoreShape)(store), {
            lat,
            lng,
            pincode: buyerPincode,
            discoveryRadiusKm: buyer_visibility_util_1.UNLIMITED_DISCOVERY_RADIUS_KM,
        });
        if (!eligibility.eligible) {
            throw new common_1.BadRequestException({
                message: 'This store currently does not deliver to your location.',
                code: 'OUT_OF_DELIVERY_ZONE',
                nearestStores: await this.findNearestStores(lat, lng, 3, storeId),
            });
        }
    }
    async updateStoreRadius(adminUserId, storeId, dto) {
        const radius = (0, geospatial_util_1.normalizeDeliveryRadiusKm)(dto.deliveryRadiusKm);
        const updated = await this.prisma.store.update({
            where: { id: storeId },
            data: {
                deliveryRadiusKm: radius,
                ...(dto.locality !== undefined && { locality: dto.locality }),
            },
            select: {
                id: true,
                name: true,
                slug: true,
                deliveryRadiusKm: true,
                locality: true,
                latitude: true,
                longitude: true,
            },
        });
        await this.buyerCache.deleteByPattern('buyer:stores:*');
        await this.buyerCache.invalidate(`buyer:store:${updated.slug}`);
        return { ...updated, updatedBy: adminUserId };
    }
    async listAddresses(userId) {
        const bp = await this.requireBuyerProfile(userId);
        const rows = await this.prisma.address.findMany({
            where: { buyerProfileId: bp.id },
            orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
        });
        return rows.map((a) => this.serializeAddress(a));
    }
    async createAddress(userId, dto) {
        const bp = await this.requireBuyerProfile(userId);
        const validated = await this.locations.validatePincode({
            pincode: dto.pincode,
            locationCityId: dto.locationCityId,
            locationAreaId: dto.locationAreaId,
        });
        if (dto.isDefault) {
            await this.prisma.address.updateMany({
                where: { buyerProfileId: bp.id },
                data: { isDefault: false },
            });
        }
        const created = await this.prisma.address.create({
            data: {
                buyerProfileId: bp.id,
                label: dto.label ?? client_1.AddressLabel.HOME,
                line1: dto.line1,
                line2: dto.line2,
                landmark: dto.landmark,
                city: dto.city || validated.city,
                state: dto.state || validated.state,
                pincode: dto.pincode,
                latitude: dto.latitude ?? validated.latitude,
                longitude: dto.longitude ?? validated.longitude,
                locationPincodeId: dto.locationPincodeId ?? validated.locationPincodeId,
                locationAreaId: dto.locationAreaId ?? validated.locationAreaId,
                locationCityId: dto.locationCityId ?? validated.locationCityId,
                isDefault: dto.isDefault ?? false,
            },
        });
        return this.serializeAddress(created);
    }
    async updateAddress(userId, id, dto) {
        const bp = await this.requireBuyerProfile(userId);
        const existing = await this.prisma.address.findFirst({
            where: { id, buyerProfileId: bp.id },
        });
        if (!existing)
            throw new common_1.NotFoundException('Address not found');
        if (dto.isDefault) {
            await this.prisma.address.updateMany({
                where: { buyerProfileId: bp.id },
                data: { isDefault: false },
            });
        }
        const updated = await this.prisma.address.update({
            where: { id },
            data: {
                ...(dto.label !== undefined && { label: dto.label }),
                ...(dto.line1 !== undefined && { line1: dto.line1 }),
                ...(dto.line2 !== undefined && { line2: dto.line2 }),
                ...(dto.landmark !== undefined && { landmark: dto.landmark }),
                ...(dto.city !== undefined && { city: dto.city }),
                ...(dto.state !== undefined && { state: dto.state }),
                ...(dto.pincode !== undefined && { pincode: dto.pincode }),
                ...(dto.latitude !== undefined && { latitude: dto.latitude }),
                ...(dto.longitude !== undefined && { longitude: dto.longitude }),
                ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
            },
        });
        return this.serializeAddress(updated);
    }
    async deleteAddress(userId, id) {
        const bp = await this.requireBuyerProfile(userId);
        const existing = await this.prisma.address.findFirst({
            where: { id, buyerProfileId: bp.id },
        });
        if (!existing)
            throw new common_1.NotFoundException('Address not found');
        await this.prisma.address.delete({ where: { id } });
        return { deleted: true };
    }
    async getOperationsMap() {
        const [fleet, stores, zones, unassignedOrders, franchiseTerritories, riderClusters, demandHotspots, activeBatches, fleetAlerts] = await Promise.all([
            this.tracking.getFleetLive(),
            this.prisma.store.findMany({
                where: { status: client_1.StoreStatus.APPROVED, isActive: true, deletedAt: null },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    latitude: true,
                    longitude: true,
                    deliveryRadiusKm: true,
                    locality: true,
                    city: { select: { name: true } },
                },
                take: 500,
            }),
            this.prisma.zone.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    centerLat: true,
                    centerLng: true,
                    radiusKm: true,
                    city: { select: { name: true } },
                },
                take: 100,
            }),
            this.prisma.order.findMany({
                where: (0, rider_assignment_util_1.unassignedOrderWhere)(),
                select: {
                    id: true,
                    orderNumber: true,
                    deliveryLat: true,
                    deliveryLng: true,
                    store: { select: { id: true, name: true, latitude: true, longitude: true } },
                },
                take: 50,
            }),
            this.prisma.franchiseTerritory.findMany({
                where: { franchise: { status: 'ACTIVE' } },
                select: {
                    id: true,
                    city: true,
                    state: true,
                    pincodes: true,
                    exclusivityEnabled: true,
                    franchise: { select: { id: true, businessName: true } },
                },
                take: 100,
            }),
            this.clusters.listClusters(),
            this.hotspots.getHotspots(20),
            this.batching.listActiveBatches(),
            this.fleetAlerts.listOpenAlerts(),
        ]);
        return {
            fleet,
            stores: stores.map((s) => ({
                ...s,
                deliveryRadiusKm: (0, geospatial_util_1.normalizeDeliveryRadiusKm)(s.deliveryRadiusKm),
            })),
            zones,
            franchiseTerritories: franchiseTerritories.map((t) => ({
                ...t,
                color: t.exclusivityEnabled ? '#8b5cf6' : '#6366f1',
            })),
            riderClusters: riderClusters.map((c) => ({
                ...c,
                color: c.demandSupplyRatio > 2 ? '#ef4444' : c.demandSupplyRatio > 1 ? '#f59e0b' : '#22c55e',
            })),
            demandHotspots: demandHotspots.map((h) => ({
                ...h,
                color: '#f97316',
            })),
            batchRoutes: activeBatches.map((b) => ({
                id: b.id,
                riderName: b.rider.name,
                status: b.status,
                orders: b.items.map((i) => i.order.orderNumber),
            })),
            fleetAlerts,
            unassignedOrders,
            activeDeliveries: fleet.riders
                .filter((r) => r.currentDelivery && r.location)
                .map((r) => ({
                riderId: r.id,
                riderName: r.name,
                order: r.currentDelivery,
                lat: r.location.lat,
                lng: r.location.lng,
            })),
            updatedAt: fleet.updatedAt,
        };
    }
    async getHotspotAnalytics() {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const orders = await this.prisma.order.findMany({
            where: {
                createdAt: { gte: since },
                status: { in: ['DELIVERED', 'COMPLETED'] },
            },
            select: {
                deliveryLat: true,
                deliveryLng: true,
                totalAmount: true,
                createdAt: true,
                store: { select: { city: { select: { name: true } }, locality: true } },
            },
            take: 5000,
        });
        const localityMap = new Map();
        const cityMap = new Map();
        const hourMap = new Map();
        for (const o of orders) {
            const locality = o.store.locality ?? 'Unknown';
            const city = o.store.city?.name ?? 'Unknown';
            const cur = localityMap.get(locality) ?? { count: 0, revenue: 0 };
            localityMap.set(locality, {
                count: cur.count + 1,
                revenue: cur.revenue + Number(o.totalAmount),
            });
            cityMap.set(city, (cityMap.get(city) ?? 0) + 1);
            hourMap.set(o.createdAt.getHours(), (hourMap.get(o.createdAt.getHours()) ?? 0) + 1);
        }
        return {
            totalDelivered: orders.length,
            topLocalities: [...localityMap.entries()]
                .map(([name, v]) => ({ name, ...v }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
            topCities: [...cityMap.entries()]
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
            peakHours: [...hourMap.entries()]
                .map(([hour, count]) => ({ hour, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 6),
            deliveryDensity: orders.length,
        };
    }
    async getMerchantAreaAnalytics(userId, storeId) {
        const store = await this.assertStoreOwned(userId, storeId);
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const orders = await this.prisma.order.findMany({
            where: {
                storeId,
                createdAt: { gte: since },
                status: { in: ['DELIVERED', 'COMPLETED'] },
            },
            select: { deliveryLat: true, deliveryLng: true, totalAmount: true, buyerProfileId: true },
        });
        const grid = new Map();
        for (const o of orders) {
            const key = `${o.deliveryLat.toFixed(2)},${o.deliveryLng.toFixed(2)}`;
            const cell = grid.get(key) ?? { count: 0, revenue: 0, buyers: new Set() };
            cell.count += 1;
            cell.revenue += Number(o.totalAmount);
            cell.buyers.add(o.buyerProfileId);
            grid.set(key, cell);
        }
        const buyerOrderCounts = new Map();
        for (const o of orders) {
            buyerOrderCounts.set(o.buyerProfileId, (buyerOrderCounts.get(o.buyerProfileId) ?? 0) + 1);
        }
        const topAreas = [...grid.entries()]
            .map(([key, v]) => ({
            areaKey: key,
            orderCount: v.count,
            revenue: Math.round(v.revenue * 100) / 100,
            repeatBuyers: [...v.buyers].filter((id) => (buyerOrderCounts.get(id) ?? 0) > 1).length,
        }))
            .sort((a, b) => b.orderCount - a.orderCount)
            .slice(0, 10);
        return {
            storeId: store.id,
            storeName: store.name,
            topDeliveryAreas: topAreas,
            totalOrders: orders.length,
        };
    }
    serializeAddress(a) {
        return {
            id: a.id,
            label: a.label,
            line1: a.line1,
            line2: a.line2,
            landmark: a.landmark,
            city: a.city,
            state: a.state,
            pincode: a.pincode,
            latitude: a.latitude,
            longitude: a.longitude,
            isDefault: a.isDefault,
        };
    }
    async requireBuyerProfile(userId) {
        const bp = await this.prisma.buyerProfile.findUnique({ where: { userId } });
        if (!bp)
            throw new common_1.NotFoundException('Buyer profile not found');
        return bp;
    }
    async assertStoreOwned(userId, storeId) {
        const profile = await this.prisma.merchantProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.ForbiddenException('Merchant profile not found');
        const store = await this.prisma.store.findFirst({
            where: { id: storeId, merchantProfileId: profile.id, deletedAt: null },
        });
        if (!store)
            throw new common_1.ForbiddenException('Store not found');
        return store;
    }
};
exports.GeospatialService = GeospatialService;
exports.GeospatialService = GeospatialService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        buyer_cache_service_1.BuyerCacheService,
        delivery_tracking_service_1.DeliveryTrackingService,
        rider_clustering_service_1.RiderClusteringService,
        batching_service_1.BatchingService,
        fleet_alert_service_1.FleetAlertService,
        hotspot_service_1.HotspotService,
        location_directory_service_1.LocationDirectoryService])
], GeospatialService);
//# sourceMappingURL=geospatial.service.js.map