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
var DeliveryTrackingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryTrackingService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const delivery_eta_util_1 = require("../../common/utils/delivery-eta.util");
const order_cache_service_1 = require("../order/order-cache.service");
const normalized_status_labels_1 = require("../logistics/mappers/normalized-status-labels");
const rider_assignment_util_1 = require("../rider-assignment/rider-assignment.util");
const delivery_tracking_cache_service_1 = require("./delivery-tracking-cache.service");
const delivery_tracking_events_1 = require("./delivery-tracking.events");
const ACTIVE_DELIVERY_STATUSES = [
    client_1.DeliveryStatus.ASSIGNED,
    client_1.DeliveryStatus.ACCEPTED,
    client_1.DeliveryStatus.ARRIVED_AT_STORE,
    client_1.DeliveryStatus.PICKED_UP,
    client_1.DeliveryStatus.IN_TRANSIT,
    client_1.DeliveryStatus.ARRIVED_AT_CUSTOMER,
];
const TRACKABLE_ORDER_STATUSES = [
    client_1.OrderStatus.RIDER_ASSIGNED,
    client_1.OrderStatus.PICKED_UP,
    client_1.OrderStatus.OUT_FOR_DELIVERY,
    client_1.OrderStatus.DELIVERED,
];
let DeliveryTrackingService = DeliveryTrackingService_1 = class DeliveryTrackingService {
    constructor(prisma, events, trackingCache, orderCache) {
        this.prisma = prisma;
        this.events = events;
        this.trackingCache = trackingCache;
        this.orderCache = orderCache;
        this.logger = new common_1.Logger(DeliveryTrackingService_1.name);
    }
    async processRiderLocation(riderProfileId, dto) {
        const rider = await this.prisma.riderProfile.findUnique({
            where: { id: riderProfileId },
            select: { status: true, user: { select: { status: true } } },
        });
        if (!rider)
            return;
        if (rider.status === client_1.RiderStatus.OFFLINE || rider.user.status === 'SUSPENDED') {
            return;
        }
        const activeDelivery = await this.prisma.delivery.findFirst({
            where: {
                riderProfileId,
                status: { in: ACTIVE_DELIVERY_STATUSES },
            },
            include: {
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        status: true,
                        storeId: true,
                        deliveryLat: true,
                        deliveryLng: true,
                        deliveryAddress: true,
                        store: { select: { latitude: true, longitude: true, name: true } },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
        if (!activeDelivery)
            return;
        const now = new Date();
        await this.prisma.deliveryTracking.create({
            data: {
                deliveryId: activeDelivery.id,
                riderProfileId,
                lat: dto.latitude,
                lng: dto.longitude,
                heading: dto.heading,
                speed: dto.speed,
                accuracy: dto.accuracy,
                recordedAt: now,
            },
        });
        const eta = await this.recalculateEta(activeDelivery, dto.latitude, dto.longitude, now);
        await this.trackingCache.invalidateTracking(activeDelivery.orderId);
        await this.trackingCache.invalidateFleet();
        await this.orderCache.invalidate(activeDelivery.orderId);
        await this.orderCache.invalidateAll(activeDelivery.orderId);
        const payload = {
            orderId: activeDelivery.orderId,
            orderNumber: activeDelivery.order.orderNumber,
            storeId: activeDelivery.order.storeId,
            riderProfileId,
            lat: dto.latitude,
            lng: dto.longitude,
            heading: dto.heading ?? null,
            speed: dto.speed ?? null,
            deliveryStatus: activeDelivery.status,
            orderStatus: activeDelivery.order.status,
            ...eta,
        };
        this.events.emit(`ws.${delivery_tracking_events_1.TRACKING_EVENTS.LOCATION_UPDATED}`, payload);
        if (eta.estimatedMins != null) {
            this.events.emit(`ws.${delivery_tracking_events_1.TRACKING_EVENTS.ETA_UPDATED}`, payload);
        }
    }
    async recalculateEta(delivery, riderLat, riderLng, now) {
        const etaResult = (0, delivery_eta_util_1.computeDeliveryEta)({
            orderStatus: delivery.order.status,
            deliveryStatus: delivery.status,
            storeLat: delivery.order.store.latitude,
            storeLng: delivery.order.store.longitude,
            customerLat: delivery.order.deliveryLat,
            customerLng: delivery.order.deliveryLng,
            riderLat,
            riderLng,
            pickedUpAt: delivery.pickedUpAt,
            hasActiveAssignment: true,
        });
        let estimatedArrivalAt = null;
        if (etaResult.estimatedMins != null) {
            estimatedArrivalAt = new Date(now.getTime() + etaResult.estimatedMins * 60_000);
        }
        await this.prisma.delivery.update({
            where: { id: delivery.id },
            data: {
                estimatedMins: etaResult.estimatedMins,
                estimatedArrivalAt,
            },
        });
        return {
            estimatedMins: etaResult.estimatedMins,
            estimatedArrivalAt: estimatedArrivalAt?.toISOString() ?? null,
            etaAvailable: etaResult.etaAvailable,
        };
    }
    async getBuyerTracking(userId, orderId) {
        const bp = await this.prisma.buyerProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!bp)
            throw new common_1.NotFoundException('Buyer profile not found');
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, buyerProfileId: bp.id },
            select: this.orderTrackingSelect(),
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return this.buildTrackingView(order);
    }
    async getMerchantTracking(userId, orderId) {
        const stores = await this.prisma.store.findMany({
            where: { merchantProfile: { userId } },
            select: { id: true },
        });
        const storeIds = stores.map((s) => s.id);
        if (storeIds.length === 0)
            throw new common_1.ForbiddenException('No stores');
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, storeId: { in: storeIds } },
            select: this.orderTrackingSelect(),
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return this.buildTrackingView(order);
    }
    async getAdminTracking(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: this.orderTrackingSelect(),
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return this.buildTrackingView(order);
    }
    async assertSubscribeAccess(user, data) {
        const orderId = data.orderId ?? data.id;
        switch (data.namespace) {
            case 'buyer': {
                if (!user.roles.includes('BUYER')) {
                    throw new common_1.ForbiddenException('Buyer role required');
                }
                const bp = await this.prisma.buyerProfile.findUnique({
                    where: { userId: user.id },
                    select: { id: true },
                });
                if (!bp)
                    throw new common_1.ForbiddenException('Buyer profile not found');
                const order = await this.prisma.order.findFirst({
                    where: { id: orderId, buyerProfileId: bp.id },
                    select: { id: true },
                });
                if (!order)
                    throw new common_1.ForbiddenException('Order access denied');
                return;
            }
            case 'merchant': {
                if (!user.roles.includes('MERCHANT')) {
                    throw new common_1.ForbiddenException('Merchant role required');
                }
                const stores = await this.prisma.store.findMany({
                    where: { merchantProfile: { userId: user.id } },
                    select: { id: true },
                });
                const storeIds = stores.map((s) => s.id);
                if (storeIds.length === 0)
                    throw new common_1.ForbiddenException('No stores');
                const order = await this.prisma.order.findFirst({
                    where: { id: orderId, storeId: { in: storeIds } },
                    select: { id: true },
                });
                if (!order)
                    throw new common_1.ForbiddenException('Order access denied');
                return;
            }
            case 'rider': {
                if (!user.roles.includes('RIDER')) {
                    throw new common_1.ForbiddenException('Rider role required');
                }
                const rider = await this.prisma.riderProfile.findUnique({
                    where: { userId: user.id },
                    select: { id: true },
                });
                if (!rider)
                    throw new common_1.ForbiddenException('Rider profile not found');
                const delivery = await this.prisma.delivery.findFirst({
                    where: { orderId, riderProfileId: rider.id },
                    select: { id: true },
                });
                if (!delivery)
                    throw new common_1.ForbiddenException('Delivery access denied');
                return;
            }
            case 'admin': {
                const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
                if (!isAdmin)
                    throw new common_1.ForbiddenException('Admin role required');
                if (data.id !== 'fleet' && orderId) {
                    const order = await this.prisma.order.findUnique({
                        where: { id: orderId },
                        select: { id: true },
                    });
                    if (!order)
                        throw new common_1.NotFoundException('Order not found');
                }
                return;
            }
            default:
                throw new common_1.ForbiddenException('Invalid tracking namespace');
        }
    }
    async getFleetLive(statusFilter) {
        const riderWhere = {};
        if (statusFilter === 'ONLINE') {
            riderWhere.status = { in: [client_1.RiderStatus.ONLINE, client_1.RiderStatus.BUSY] };
        }
        else if (statusFilter === 'BUSY') {
            riderWhere.status = { in: [client_1.RiderStatus.BUSY, client_1.RiderStatus.ON_DELIVERY] };
        }
        else if (statusFilter === 'OFFLINE') {
            riderWhere.status = client_1.RiderStatus.OFFLINE;
        }
        const riders = await this.prisma.riderProfile.findMany({
            where: riderWhere,
            select: {
                id: true,
                name: true,
                status: true,
                vehicleType: true,
                currentLat: true,
                currentLng: true,
                currentHeading: true,
                currentSpeed: true,
                lastLocationAt: true,
                zones: { select: { zone: { select: { name: true } } }, take: 1 },
                deliveries: {
                    where: { status: { in: ACTIVE_DELIVERY_STATUSES } },
                    take: 1,
                    select: {
                        id: true,
                        status: true,
                        estimatedMins: true,
                        estimatedArrivalAt: true,
                        order: { select: { id: true, orderNumber: true, status: true, storeId: true } },
                    },
                },
                user: { select: { phone: true, status: true } },
            },
            take: 200,
        });
        const unassigned = await this.prisma.order.count({
            where: (0, rider_assignment_util_1.unassignedOrderWhere)(),
        });
        const activeOrders = await this.prisma.order.count({
            where: { status: { in: TRACKABLE_ORDER_STATUSES } },
        });
        return {
            riders: riders.map((r) => ({
                id: r.id,
                name: r.name,
                phone: r.user.phone,
                status: r.user.status === 'SUSPENDED' ? 'SUSPENDED' : r.status,
                vehicleType: r.vehicleType,
                zone: r.zones[0]?.zone.name ?? null,
                location: r.currentLat != null && r.currentLng != null
                    ? {
                        lat: r.currentLat,
                        lng: r.currentLng,
                        heading: r.currentHeading,
                        speed: r.currentSpeed,
                        lastLocationAt: r.lastLocationAt?.toISOString() ?? null,
                    }
                    : null,
                currentDelivery: r.deliveries[0]
                    ? {
                        orderId: r.deliveries[0].order.id,
                        orderNumber: r.deliveries[0].order.orderNumber,
                        status: r.deliveries[0].status,
                        etaMins: r.deliveries[0].estimatedMins,
                    }
                    : null,
            })),
            stats: {
                onlineRiders: riders.filter((r) => r.status === client_1.RiderStatus.ONLINE).length,
                busyRiders: riders.filter((r) => (r.status === client_1.RiderStatus.BUSY || r.status === client_1.RiderStatus.ON_DELIVERY)).length,
                offlineRiders: riders.filter((r) => r.status === client_1.RiderStatus.OFFLINE).length,
                activeOrders,
                unassignedOrders: unassigned,
            },
            updatedAt: new Date().toISOString(),
        };
    }
    async getAnalytics() {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const deliveries = await this.prisma.delivery.findMany({
            where: {
                deliveredAt: { gte: since },
                status: client_1.DeliveryStatus.DELIVERED,
            },
            select: {
                estimatedMins: true,
                assignedAt: true,
                deliveredAt: true,
                riderProfileId: true,
            },
        });
        const etas = deliveries
            .map((d) => d.estimatedMins)
            .filter((m) => m != null);
        const avgEta = etas.length ? Math.round(etas.reduce((a, b) => a + b, 0) / etas.length) : 0;
        const durations = deliveries
            .filter((d) => d.assignedAt && d.deliveredAt)
            .map((d) => (d.deliveredAt.getTime() - d.assignedAt.getTime()) / 60_000);
        const avgDeliveryMins = durations.length
            ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
            : 0;
        const late = deliveries.filter((d) => {
            if (!d.estimatedMins || !d.assignedAt || !d.deliveredAt)
                return false;
            const actual = (d.deliveredAt.getTime() - d.assignedAt.getTime()) / 60_000;
            return actual > d.estimatedMins + 10;
        }).length;
        const riderCounts = await this.prisma.riderProfile.groupBy({
            by: ['status'],
            _count: { id: true },
        });
        const perRider = await this.prisma.delivery.groupBy({
            by: ['riderProfileId'],
            where: { deliveredAt: { gte: since }, status: client_1.DeliveryStatus.DELIVERED },
            _count: { id: true },
        });
        return {
            avgEtaMins: avgEta,
            avgDeliveryTimeMins: avgDeliveryMins,
            lateDeliveries: late,
            onlineRiders: riderCounts.find((r) => r.status === client_1.RiderStatus.ONLINE)?._count.id ?? 0,
            busyRiders: (riderCounts.find((r) => r.status === client_1.RiderStatus.BUSY)?._count.id ?? 0) +
                (riderCounts.find((r) => r.status === client_1.RiderStatus.ON_DELIVERY)?._count.id ?? 0),
            deliveriesPerRider: perRider.map((r) => ({
                riderProfileId: r.riderProfileId,
                count: r._count.id,
            })),
        };
    }
    emitDeliveryEvent(event, payload) {
        const map = {
            STARTED: delivery_tracking_events_1.TRACKING_EVENTS.STARTED,
            ARRIVED: delivery_tracking_events_1.TRACKING_EVENTS.ARRIVED,
            COMPLETED: delivery_tracking_events_1.TRACKING_EVENTS.COMPLETED,
        };
        this.events.emit(`ws.${map[event]}`, payload);
    }
    emitOrderStatus(payload) {
        void this.trackingCache.invalidateTracking(payload.orderId);
        void this.orderCache.invalidateAll(payload.orderId);
        this.events.emit(`ws.${delivery_tracking_events_1.TRACKING_EVENTS.ORDER_STATUS}`, payload);
    }
    orderTrackingSelect() {
        return {
            id: true,
            orderNumber: true,
            status: true,
            storeId: true,
            deliveryLat: true,
            deliveryLng: true,
            deliveryAddress: true,
            store: { select: { name: true, latitude: true, longitude: true } },
            delivery: {
                select: {
                    id: true,
                    status: true,
                    pickedUpAt: true,
                    estimatedMins: true,
                    estimatedArrivalAt: true,
                    distanceKm: true,
                    riderProfile: {
                        select: {
                            id: true,
                            name: true,
                            vehicleType: true,
                            currentLat: true,
                            currentLng: true,
                            currentHeading: true,
                            currentSpeed: true,
                            lastLocationAt: true,
                        },
                    },
                },
            },
            providerShipment: {
                select: {
                    id: true,
                    providerType: true,
                    trackingNumber: true,
                    normalizedStatus: true,
                    driverName: true,
                    driverPhone: true,
                    vehicleType: true,
                    estimatedEtaMins: true,
                    estimatedArrivalAt: true,
                    provider: { select: { name: true } },
                    events: {
                        orderBy: { occurredAt: 'asc' },
                        take: 100,
                        select: {
                            lat: true,
                            lng: true,
                            occurredAt: true,
                            normalizedStatus: true,
                            description: true,
                            providerStatus: true,
                        },
                    },
                },
            },
        };
    }
    async buildTrackingView(order) {
        const cached = await this.trackingCache.getTracking(order.id);
        if (cached)
            return cached;
        const hasProvider = Boolean(order.providerShipment);
        const trackable = TRACKABLE_ORDER_STATUSES.includes(order.status) &&
            Boolean(order.delivery) &&
            (Boolean(order.delivery?.riderProfile) || hasProvider);
        if (!trackable || !order.delivery) {
            throw new common_1.ForbiddenException('Live tracking not available for this order');
        }
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const points = await this.prisma.deliveryTracking.findMany({
            where: { deliveryId: order.delivery.id, recordedAt: { gte: since } },
            orderBy: { recordedAt: 'asc' },
            take: 500,
            select: { lat: true, lng: true, recordedAt: true },
        });
        const providerEvents = order.providerShipment?.events ?? [];
        const providerRoute = providerEvents
            .filter((e) => e.lat != null && e.lng != null)
            .map((e) => ({
            lat: e.lat,
            lng: e.lng,
            recordedAt: e.occurredAt.toISOString(),
        }));
        const rider = order.delivery.riderProfile;
        const provider = order.providerShipment;
        const latestProviderLoc = [...providerEvents].reverse().find((e) => e.lat != null && e.lng != null);
        const syntheticRider = !rider && provider?.driverName
            ? {
                id: `provider:${provider.id}`,
                name: provider.driverName,
                lat: latestProviderLoc?.lat ?? null,
                lng: latestProviderLoc?.lng ?? null,
                heading: null,
                speed: null,
                lastLocationAt: latestProviderLoc?.occurredAt.toISOString() ?? null,
                vehicleType: provider.vehicleType,
            }
            : rider
                ? {
                    id: rider.id,
                    name: rider.name,
                    lat: rider.currentLat,
                    lng: rider.currentLng,
                    heading: rider.currentHeading,
                    speed: rider.currentSpeed,
                    lastLocationAt: rider.lastLocationAt?.toISOString() ?? null,
                    vehicleType: rider.vehicleType,
                }
                : null;
        const etaResult = (0, delivery_eta_util_1.computeDeliveryEta)({
            orderStatus: order.status,
            deliveryStatus: order.delivery.status,
            storeLat: order.store.latitude,
            storeLng: order.store.longitude,
            customerLat: order.deliveryLat,
            customerLng: order.deliveryLng,
            riderLat: syntheticRider?.lat ?? undefined,
            riderLng: syntheticRider?.lng ?? undefined,
            pickedUpAt: order.delivery.pickedUpAt,
            hasActiveAssignment: Boolean(syntheticRider),
        });
        const riderDistanceFromStoreKm = syntheticRider?.lat != null && syntheticRider?.lng != null
            ? (0, delivery_eta_util_1.safeDistanceKm)(syntheticRider.lat, syntheticRider.lng, order.store.latitude, order.store.longitude)
            : null;
        const riderDistanceToCustomerKm = syntheticRider?.lat != null && syntheticRider?.lng != null
            ? (0, delivery_eta_util_1.safeDistanceKm)(syntheticRider.lat, syntheticRider.lng, order.deliveryLat, order.deliveryLng)
            : null;
        const view = {
            orderId: order.id,
            orderNumber: order.orderNumber,
            orderStatus: order.status,
            deliveryStatus: order.delivery.status,
            store: {
                lat: order.store.latitude,
                lng: order.store.longitude,
                name: order.store.name,
            },
            customer: {
                lat: order.deliveryLat,
                lng: order.deliveryLng,
                address: order.deliveryAddress,
            },
            rider: syntheticRider,
            route: points.length > 0
                ? points.map((p) => ({
                    lat: p.lat,
                    lng: p.lng,
                    recordedAt: p.recordedAt.toISOString(),
                }))
                : providerRoute,
            eta: {
                estimatedMins: order.delivery.estimatedMins ??
                    provider?.estimatedEtaMins ??
                    etaResult.estimatedMins,
                estimatedArrivalAt: order.delivery.estimatedArrivalAt?.toISOString() ??
                    provider?.estimatedArrivalAt?.toISOString() ??
                    null,
                etaAvailable: etaResult.etaAvailable,
                distanceKm: order.delivery.distanceKm,
                riderDistanceFromStoreKm,
                riderDistanceToCustomerKm,
            },
            trackingActive: trackable && order.status !== client_1.OrderStatus.DELIVERED,
            progressStage: this.resolveProgressStage(order.status, order.delivery.status),
            updatedAt: new Date().toISOString(),
            ...(provider
                ? {
                    provider: {
                        type: provider.providerType,
                        name: provider.provider.name,
                        trackingNumber: provider.trackingNumber,
                        normalizedStatus: provider.normalizedStatus,
                        normalizedStatusLabel: (0, normalized_status_labels_1.labelForNormalizedStatus)(provider.normalizedStatus),
                        badgeLabel: `Delivered by ${provider.provider.name}`,
                        driverName: provider.driverName,
                        driverPhone: provider.driverPhone,
                        vehicleType: provider.vehicleType,
                    },
                    providerTimeline: providerEvents.map((e) => ({
                        status: e.normalizedStatus,
                        label: (0, normalized_status_labels_1.labelForNormalizedStatus)(e.normalizedStatus),
                        description: e.description ?? e.providerStatus,
                        occurredAt: e.occurredAt.toISOString(),
                    })),
                    hasLiveProviderLocation: Boolean(latestProviderLoc),
                }
                : {}),
        };
        await this.trackingCache.setTracking(order.id, view);
        return view;
    }
    resolveProgressStage(orderStatus, deliveryStatus) {
        if (orderStatus === client_1.OrderStatus.DELIVERED || deliveryStatus === client_1.DeliveryStatus.DELIVERED) {
            return 'delivered';
        }
        if (deliveryStatus === client_1.DeliveryStatus.ARRIVED_AT_CUSTOMER ||
            orderStatus === client_1.OrderStatus.OUT_FOR_DELIVERY) {
            return 'arriving';
        }
        if (deliveryStatus === client_1.DeliveryStatus.PICKED_UP ||
            deliveryStatus === client_1.DeliveryStatus.IN_TRANSIT ||
            orderStatus === client_1.OrderStatus.PICKED_UP) {
            return 'out_for_delivery';
        }
        if (deliveryStatus === client_1.DeliveryStatus.ARRIVED_AT_STORE) {
            return 'at_store';
        }
        if (orderStatus === client_1.OrderStatus.RIDER_ASSIGNED) {
            return 'rider_to_store';
        }
        return 'waiting';
    }
    async pruneTrackingPoints() {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const result = await this.prisma.deliveryTracking.deleteMany({
            where: { recordedAt: { lt: cutoff } },
        });
        if (result.count > 0) {
            this.logger.log(`Pruned ${result.count} delivery tracking points older than 24h`);
        }
    }
    async summarizeOldRoutes() {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const deliveries = await this.prisma.delivery.findMany({
            where: { deliveredAt: { lt: weekAgo, not: null } },
            select: { id: true },
            take: 100,
        });
        for (const d of deliveries) {
            const count = await this.prisma.deliveryTracking.count({ where: { deliveryId: d.id } });
            if (count > 1) {
                const last = await this.prisma.deliveryTracking.findFirst({
                    where: { deliveryId: d.id },
                    orderBy: { recordedAt: 'desc' },
                });
                if (last) {
                    await this.prisma.deliveryTracking.deleteMany({
                        where: { deliveryId: d.id, id: { not: last.id } },
                    });
                }
            }
        }
    }
};
exports.DeliveryTrackingService = DeliveryTrackingService;
__decorate([
    (0, schedule_1.Cron)('0 3 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeliveryTrackingService.prototype, "pruneTrackingPoints", null);
__decorate([
    (0, schedule_1.Cron)('0 4 * * 0'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeliveryTrackingService.prototype, "summarizeOldRoutes", null);
exports.DeliveryTrackingService = DeliveryTrackingService = DeliveryTrackingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2,
        delivery_tracking_cache_service_1.DeliveryTrackingCacheService,
        order_cache_service_1.OrderCacheService])
], DeliveryTrackingService);
//# sourceMappingURL=delivery-tracking.service.js.map