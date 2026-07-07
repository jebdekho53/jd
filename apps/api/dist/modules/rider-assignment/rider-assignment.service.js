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
var RiderAssignmentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiderAssignmentService = exports.RIDER_ASSIGNMENT_EVENTS = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const ist_day_util_1 = require("../../common/utils/ist-day.util");
const audit_service_1 = require("../audit/audit.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const order_status_history_service_1 = require("../order/order-status-history.service");
const rider_assignment_cache_service_1 = require("./rider-assignment-cache.service");
const delivery_eta_util_1 = require("../../common/utils/delivery-eta.util");
const rider_assignment_util_1 = require("./rider-assignment.util");
const buyer_push_notification_service_1 = require("../push/buyer-push-notification.service");
exports.RIDER_ASSIGNMENT_EVENTS = {
    ASSIGNED: 'order.assigned',
    REASSIGNED: 'order.reassigned',
    UNASSIGNED: 'order.unassigned',
    LOCATION_UPDATED: 'rider.location.updated',
};
let RiderAssignmentService = RiderAssignmentService_1 = class RiderAssignmentService {
    constructor(prisma, audit, domainEvents, statusHistory, cache, events, buyerPush, config) {
        this.prisma = prisma;
        this.audit = audit;
        this.domainEvents = domainEvents;
        this.statusHistory = statusHistory;
        this.cache = cache;
        this.events = events;
        this.buyerPush = buyerPush;
        this.logger = new common_1.Logger(RiderAssignmentService_1.name);
        this.assignRider = this.assign;
        this.reassignRider = this.reassign;
        this.listAvailableRidersForStore = this.getAvailableRiders;
        this.countAvailableRidersForStore = async (storeId) => (await this.getAvailableRiders(storeId)).length;
        this.autoAcceptSeconds = config.get('RIDER_AUTO_ACCEPT_SECONDS', rider_assignment_util_1.ASSIGNMENT_OFFER_SECONDS);
    }
    async autoAssign(orderId) {
        const best = await this.findBestRider(orderId);
        if (!best)
            return null;
        return this.assign(orderId, best.id, 'system');
    }
    async assign(orderId, riderProfileId, assignedBy, ipAddress) {
        await this.assertRiderEligible(riderProfileId, orderId);
        const order = await this.requireAssignableOrder(orderId);
        const delivery = await this.upsertDelivery(order, riderProfileId, assignedBy);
        await this.createAssignmentRecord(delivery.id, riderProfileId, assignedBy);
        await this.finishAssignment({
            deliveryId: delivery.id,
            orderId,
            riderProfileId,
            orderNumber: order.orderNumber,
            actorId: assignedBy,
            ipAddress,
            isReassignment: false,
            event: exports.RIDER_ASSIGNMENT_EVENTS.ASSIGNED,
        });
        return { deliveryId: delivery.id, riderProfileId };
    }
    async reassign(orderId, riderProfileId, assignedBy, ipAddress) {
        const delivery = await this.prisma.delivery.findFirst({
            where: { orderId },
            include: { order: { select: { id: true, orderNumber: true, status: true } } },
        });
        if (!delivery)
            throw new common_1.NotFoundException('Delivery record not found for this order');
        const cancellable = new Set([
            client_1.DeliveryStatus.ASSIGNED,
            client_1.DeliveryStatus.ACCEPTED,
            client_1.DeliveryStatus.ARRIVED_AT_STORE,
        ]);
        if (!cancellable.has(delivery.status)) {
            throw new common_1.BadRequestException(`Cannot reassign: delivery is in status ${delivery.status}`);
        }
        if (delivery.riderProfileId) {
            await this.prisma.deliveryAssignment.updateMany({
                where: {
                    deliveryId: delivery.id,
                    riderProfileId: delivery.riderProfileId,
                    status: { in: [client_1.AssignmentStatus.OFFERED, client_1.AssignmentStatus.ACCEPTED] },
                },
                data: { status: client_1.AssignmentStatus.CANCELLED, respondedAt: new Date() },
            });
            await this.prisma.riderProfile.update({
                where: { id: delivery.riderProfileId },
                data: { status: client_1.RiderStatus.ONLINE },
            });
        }
        await this.assertRiderEligible(riderProfileId, orderId);
        await this.prisma.delivery.update({
            where: { id: delivery.id },
            data: {
                riderProfileId,
                status: client_1.DeliveryStatus.ASSIGNED,
                assignedAt: new Date(),
                assignedBy,
            },
        });
        await this.createAssignmentRecord(delivery.id, riderProfileId, assignedBy);
        await this.finishAssignment({
            deliveryId: delivery.id,
            orderId,
            riderProfileId,
            orderNumber: delivery.order.orderNumber,
            actorId: assignedBy,
            ipAddress,
            isReassignment: true,
            event: exports.RIDER_ASSIGNMENT_EVENTS.REASSIGNED,
        });
        return { deliveryId: delivery.id, riderProfileId };
    }
    async unassign(orderId, actorId, ipAddress) {
        const delivery = await this.prisma.delivery.findFirst({
            where: { orderId },
            include: { order: { select: { orderNumber: true } } },
        });
        if (!delivery)
            throw new common_1.NotFoundException('No delivery found for this order');
        const terminalUnassign = new Set([
            client_1.DeliveryStatus.PICKED_UP,
            client_1.DeliveryStatus.ARRIVED_AT_CUSTOMER,
            client_1.DeliveryStatus.DELIVERED,
        ]);
        if (terminalUnassign.has(delivery.status)) {
            throw new common_1.BadRequestException(`Cannot unassign delivery in status ${delivery.status}`);
        }
        if (delivery.riderProfileId) {
            await this.prisma.deliveryAssignment.updateMany({
                where: {
                    deliveryId: delivery.id,
                    status: { in: [client_1.AssignmentStatus.OFFERED, client_1.AssignmentStatus.ACCEPTED] },
                },
                data: { status: client_1.AssignmentStatus.CANCELLED, respondedAt: new Date() },
            });
            await this.prisma.riderProfile.update({
                where: { id: delivery.riderProfileId },
                data: { status: client_1.RiderStatus.ONLINE },
            });
        }
        await this.prisma.delivery.update({
            where: { id: delivery.id },
            data: {
                riderProfileId: null,
                status: client_1.DeliveryStatus.CANCELLED,
                assignedAt: null,
                assignedBy: null,
            },
        });
        await this.statusHistory.transition({
            orderId,
            toStatus: client_1.OrderStatus.READY_FOR_PICKUP,
            actorType: client_1.OrderActorType.ADMIN,
            actorId,
            note: 'Rider unassigned — returned to pickup queue',
            skipIfAlreadyStatus: false,
        });
        await this.audit.log({
            actorId,
            action: 'RIDER_UNASSIGNED',
            resourceType: 'delivery',
            resourceId: delivery.id,
            ipAddress,
            metadata: { orderId },
        });
        await this.cache.invalidateAssignmentCaches(orderId);
        this.emitWs(exports.RIDER_ASSIGNMENT_EVENTS.UNASSIGNED, { orderId, deliveryId: delivery.id });
    }
    async findBestRider(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                store: {
                    select: {
                        id: true,
                        latitude: true,
                        longitude: true,
                        storeZones: { select: { zoneId: true } },
                    },
                },
                delivery: true,
            },
        });
        if (!order || order.status !== client_1.OrderStatus.READY_FOR_PICKUP)
            return null;
        if (order.delivery && (0, rider_assignment_util_1.isActiveDeliveryStatus)(order.delivery.status))
            return null;
        const fulfillmentStoreId = await this.resolveFulfillmentStoreId(orderId, order.store.id);
        const pickupStore = fulfillmentStoreId !== order.store.id
            ? await this.prisma.store.findUnique({
                where: { id: fulfillmentStoreId },
                select: {
                    id: true,
                    latitude: true,
                    longitude: true,
                    storeZones: { select: { zoneId: true } },
                },
            })
            : order.store;
        const riders = await this.getEligibleRidersForStore(pickupStore?.id ?? order.store.id);
        if (riders.length === 0)
            return null;
        const storeLat = pickupStore?.latitude ?? order.store.latitude ?? 0;
        const storeLng = pickupStore?.longitude ?? order.store.longitude ?? 0;
        const scored = riders.map((rider) => {
            const distKm = (0, rider_assignment_util_1.haversineKm)(rider.currentLat, rider.currentLng, storeLat, storeLng);
            const idleMins = rider.lastLocationAt ? (0, rider_assignment_util_1.minutesSince)(rider.lastLocationAt) : (0, rider_assignment_util_1.minutesSince)(rider.updatedAt);
            const score = (0, rider_assignment_util_1.scoreRider)({
                inZone: rider.inZone,
                activeDeliveries: rider.activeDeliveries,
                distanceKm: distKm,
                idleMins,
            });
            return {
                id: rider.id,
                activeDeliveries: rider.activeDeliveries,
                distanceKm: Math.round(distKm * 100) / 100,
                idleMins,
                inZone: rider.inZone,
                score,
            };
        });
        scored.sort((a, b) => a.score - b.score);
        const best = scored[0];
        return best.score === Number.POSITIVE_INFINITY ? null : best;
    }
    async getAvailableRiders(storeId) {
        return this.getEligibleRidersForStore(storeId, true);
    }
    async listUnassignedOrders(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = (0, rider_assignment_util_1.unassignedOrderWhere)();
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'asc' },
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    paymentMethod: true,
                    totalAmount: true,
                    createdAt: true,
                    store: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            merchantProfile: { select: { id: true, businessName: true } },
                            storeZones: { select: { zone: { select: { id: true, name: true } } } },
                        },
                    },
                    buyerProfile: { select: { name: true } },
                },
            }),
            this.prisma.order.count({ where }),
        ]);
        const enriched = await Promise.all(orders.map(async (order) => ({
            ...order,
            totalAmount: Number(order.totalAmount),
            merchant: order.store?.merchantProfile ?? null,
            zones: order.store?.storeZones.map((sz) => sz.zone) ?? [],
            availableRiderCount: order.store
                ? (await this.getAvailableRiders(order.store.id)).length
                : 0,
            needsRider: true,
        })));
        return {
            orders: enriched,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async listLiveRiders(filters) {
        const where = {
            user: { status: client_1.UserStatus.ACTIVE, deletedAt: null },
        };
        if (filters?.status === 'ONLINE')
            where.status = client_1.RiderStatus.ONLINE;
        else if (filters?.status === 'OFFLINE')
            where.status = client_1.RiderStatus.OFFLINE;
        else if (filters?.status === 'BUSY') {
            where.status = { in: [client_1.RiderStatus.BUSY, client_1.RiderStatus.ON_DELIVERY] };
        }
        else if (filters?.status === 'SUSPENDED') {
            where.user = { status: client_1.UserStatus.SUSPENDED };
        }
        const riders = await this.prisma.riderProfile.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            take: 200,
            select: {
                id: true,
                name: true,
                status: true,
                kycStatus: true,
                vehicleType: true,
                currentLat: true,
                currentLng: true,
                lastLocationAt: true,
                updatedAt: true,
                user: { select: { phone: true, status: true } },
                zones: { select: { zone: { select: { id: true, name: true } } } },
                deliveries: {
                    where: { status: { in: [client_1.DeliveryStatus.ASSIGNED, client_1.DeliveryStatus.ACCEPTED, client_1.DeliveryStatus.PICKED_UP, client_1.DeliveryStatus.ARRIVED_AT_STORE, client_1.DeliveryStatus.ARRIVED_AT_CUSTOMER] } },
                    take: 1,
                    orderBy: { assignedAt: 'desc' },
                    select: {
                        id: true,
                        status: true,
                        order: { select: { orderNumber: true } },
                    },
                },
                _count: {
                    select: {
                        deliveries: {
                            where: {
                                status: {
                                    in: [
                                        client_1.DeliveryStatus.ASSIGNED,
                                        client_1.DeliveryStatus.ACCEPTED,
                                        client_1.DeliveryStatus.PICKED_UP,
                                        client_1.DeliveryStatus.ARRIVED_AT_STORE,
                                        client_1.DeliveryStatus.ARRIVED_AT_CUSTOMER,
                                    ],
                                },
                            },
                        },
                    },
                },
            },
        });
        return riders.map((r) => ({
            id: r.id,
            name: r.name,
            phone: r.user.phone,
            userStatus: r.user.status,
            zone: r.zones.map((z) => z.zone.name).join(', ') || '—',
            status: r.status,
            kycStatus: r.kycStatus,
            vehicleType: r.vehicleType,
            currentDelivery: r.deliveries[0]
                ? { orderNumber: r.deliveries[0].order.orderNumber, status: r.deliveries[0].status }
                : null,
            lastLocation: r.currentLat != null && r.currentLng != null
                ? { lat: r.currentLat, lng: r.currentLng }
                : null,
            lastSeen: r.lastLocationAt ?? r.updatedAt,
            activeDeliveries: r._count.deliveries,
        }));
    }
    async getMetrics() {
        const todayStart = (0, ist_day_util_1.startOfIstDay)();
        const [unassignedCount, onlineRiders, busyRiders, idleRiders, assignedToday, avgAssignmentMs,] = await Promise.all([
            this.prisma.order.count({
                where: {
                    status: client_1.OrderStatus.READY_FOR_PICKUP,
                    OR: [{ delivery: { is: null } }, { delivery: { status: client_1.DeliveryStatus.CANCELLED } }],
                },
            }),
            this.prisma.riderProfile.count({
                where: { status: client_1.RiderStatus.ONLINE, user: { status: client_1.UserStatus.ACTIVE } },
            }),
            this.prisma.riderProfile.count({
                where: { status: { in: [client_1.RiderStatus.BUSY, client_1.RiderStatus.ON_DELIVERY] } },
            }),
            this.prisma.riderProfile.count({
                where: { status: client_1.RiderStatus.ONLINE, user: { status: client_1.UserStatus.ACTIVE } },
            }),
            this.prisma.delivery.count({ where: { assignedAt: { gte: todayStart } } }),
            this.prisma.delivery.aggregate({
                where: { assignedAt: { gte: todayStart } },
                _avg: { estimatedMins: true },
            }),
        ]);
        const successRate = assignedToday > 0
            ? Math.round((assignedToday / (assignedToday + unassignedCount)) * 1000) / 10
            : 0;
        return {
            unassignedOrders: unassignedCount,
            onlineRiders,
            busyRiders,
            idleRiders,
            assignmentSuccessRate: successRate,
            avgAssignmentTimeMins: avgAssignmentMs._avg.estimatedMins ?? 0,
            assignmentsToday: assignedToday,
        };
    }
    async processPendingOffers() {
        const now = new Date();
        const pending = await this.prisma.deliveryAssignment.findMany({
            where: { status: client_1.AssignmentStatus.OFFERED, expiresAt: { lte: now } },
            include: {
                delivery: { include: { order: { select: { id: true } } } },
                riderProfile: { select: { userId: true } },
            },
            take: 50,
        });
        for (const offer of pending) {
            await this.autoAcceptOffer(offer.id, offer.delivery.id, offer.delivery.orderId, offer.riderProfile.userId);
        }
    }
    async rejectOffer(userId, orderId) {
        const rider = await this.prisma.riderProfile.findUnique({ where: { userId }, select: { id: true } });
        if (!rider)
            throw new common_1.NotFoundException('Rider profile not found');
        const delivery = await this.prisma.delivery.findFirst({
            where: { orderId, riderProfileId: rider.id },
        });
        if (!delivery || delivery.status !== client_1.DeliveryStatus.ASSIGNED) {
            throw new common_1.BadRequestException('No pending assignment to reject');
        }
        await this.prisma.deliveryAssignment.updateMany({
            where: { deliveryId: delivery.id, riderProfileId: rider.id, status: client_1.AssignmentStatus.OFFERED },
            data: { status: client_1.AssignmentStatus.REJECTED, respondedAt: new Date() },
        });
        await this.prisma.delivery.update({
            where: { id: delivery.id },
            data: { riderProfileId: null, status: client_1.DeliveryStatus.CANCELLED },
        });
        await this.prisma.riderProfile.update({
            where: { id: rider.id },
            data: { status: client_1.RiderStatus.ONLINE },
        });
        await this.statusHistory.transition({
            orderId,
            toStatus: client_1.OrderStatus.READY_FOR_PICKUP,
            actorType: client_1.OrderActorType.RIDER,
            actorId: userId,
            note: 'Rider rejected assignment',
        });
        await this.cache.invalidateAssignmentCaches(orderId);
        void this.autoAssign(orderId);
    }
    async autoAcceptOffer(assignmentId, deliveryId, orderId, riderUserId) {
        await this.prisma.deliveryAssignment.update({
            where: { id: assignmentId },
            data: { status: client_1.AssignmentStatus.ACCEPTED, respondedAt: new Date() },
        });
        await this.prisma.delivery.update({
            where: { id: deliveryId },
            data: { status: client_1.DeliveryStatus.ACCEPTED },
        });
        await this.prisma.riderProfile.updateMany({
            where: { userId: riderUserId },
            data: { status: client_1.RiderStatus.ON_DELIVERY },
        });
        await this.cache.invalidateAssignmentCaches(orderId);
    }
    async expireOffer(assignmentId, deliveryId, riderProfileId, orderId) {
        await this.prisma.deliveryAssignment.update({
            where: { id: assignmentId },
            data: { status: client_1.AssignmentStatus.EXPIRED, respondedAt: new Date() },
        });
        await this.prisma.delivery.update({
            where: { id: deliveryId },
            data: { riderProfileId: null, status: client_1.DeliveryStatus.CANCELLED },
        });
        await this.prisma.riderProfile.update({
            where: { id: riderProfileId },
            data: { status: client_1.RiderStatus.ONLINE },
        });
        await this.statusHistory.transition({
            orderId,
            toStatus: client_1.OrderStatus.READY_FOR_PICKUP,
            actorType: client_1.OrderActorType.SYSTEM,
            note: 'Assignment offer expired',
        });
        await this.cache.invalidateAssignmentCaches(orderId);
        void this.autoAssign(orderId);
    }
    async getEligibleRidersForStore(storeId, withDetails = false) {
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: {
                latitude: true,
                longitude: true,
                storeZones: { select: { zoneId: true } },
            },
        });
        if (!store)
            return [];
        const storeZoneIds = store.storeZones.map((z) => z.zoneId);
        if (storeZoneIds.length === 0)
            return [];
        const storeLat = store.latitude ?? 0;
        const storeLng = store.longitude ?? 0;
        const riders = await this.prisma.riderProfile.findMany({
            where: {
                kycStatus: client_1.KycStatus.APPROVED,
                status: client_1.RiderStatus.ONLINE,
                currentLat: { not: null },
                currentLng: { not: null },
                user: { status: client_1.UserStatus.ACTIVE, deletedAt: null },
                zones: { some: { zoneId: { in: storeZoneIds } } },
            },
            select: {
                id: true,
                name: true,
                status: true,
                currentLat: true,
                currentLng: true,
                lastLocationAt: true,
                updatedAt: true,
                zones: { select: { zoneId: true, zone: { select: { id: true, name: true } } } },
                _count: {
                    select: {
                        deliveries: {
                            where: {
                                status: {
                                    in: [
                                        client_1.DeliveryStatus.ASSIGNED,
                                        client_1.DeliveryStatus.ACCEPTED,
                                        client_1.DeliveryStatus.PICKED_UP,
                                        client_1.DeliveryStatus.ARRIVED_AT_STORE,
                                    ],
                                },
                            },
                        },
                    },
                },
            },
        });
        return riders
            .filter((r) => r._count.deliveries < rider_assignment_util_1.MAX_ACTIVE_DELIVERIES)
            .map((rider) => {
            const inZone = rider.zones.some((z) => storeZoneIds.includes(z.zoneId));
            const distKm = (0, rider_assignment_util_1.haversineKm)(rider.currentLat, rider.currentLng, storeLat, storeLng);
            const base = {
                id: rider.id,
                name: rider.name,
                status: rider.status,
                inZone,
                activeDeliveries: rider._count.deliveries,
                distanceKm: Math.round(distKm * 100) / 100,
                currentLat: rider.currentLat,
                currentLng: rider.currentLng,
                lastLocationAt: rider.lastLocationAt,
                updatedAt: rider.updatedAt,
            };
            if (!withDetails)
                return base;
            return { ...base, zones: rider.zones.map((z) => z.zone) };
        })
            .filter((r) => r.inZone)
            .sort((a, b) => {
            const scoreA = (0, rider_assignment_util_1.scoreRider)({
                inZone: a.inZone,
                activeDeliveries: a.activeDeliveries,
                distanceKm: a.distanceKm,
                idleMins: a.lastLocationAt ? (0, rider_assignment_util_1.minutesSince)(a.lastLocationAt) : 0,
            });
            const scoreB = (0, rider_assignment_util_1.scoreRider)({
                inZone: b.inZone,
                activeDeliveries: b.activeDeliveries,
                distanceKm: b.distanceKm,
                idleMins: b.lastLocationAt ? (0, rider_assignment_util_1.minutesSince)(b.lastLocationAt) : 0,
            });
            return scoreA - scoreB;
        });
    }
    async requireAssignableOrder(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                store: { select: { id: true, latitude: true, longitude: true } },
                delivery: true,
            },
        });
        if (!order)
            throw new common_1.NotFoundException(`Order not found: ${orderId}`);
        if (order.status !== client_1.OrderStatus.READY_FOR_PICKUP) {
            throw new common_1.BadRequestException(`Order must be READY_FOR_PICKUP. Current: ${order.status}`);
        }
        if (order.delivery && (0, rider_assignment_util_1.isActiveDeliveryStatus)(order.delivery.status)) {
            throw new common_1.BadRequestException('Order already has an active delivery');
        }
        return order;
    }
    async assertRiderEligible(riderProfileId, orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: { store: { select: { storeZones: { select: { zoneId: true } } } } },
        });
        const storeZoneIds = order?.store?.storeZones.map((z) => z.zoneId) ?? [];
        const rider = await this.prisma.riderProfile.findUnique({
            where: { id: riderProfileId },
            include: {
                user: { select: { status: true, deletedAt: true } },
                zones: { select: { zoneId: true } },
                _count: {
                    select: {
                        deliveries: {
                            where: {
                                status: {
                                    in: [
                                        client_1.DeliveryStatus.ASSIGNED,
                                        client_1.DeliveryStatus.ACCEPTED,
                                        client_1.DeliveryStatus.PICKED_UP,
                                        client_1.DeliveryStatus.ARRIVED_AT_STORE,
                                    ],
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!rider)
            throw new common_1.NotFoundException(`Rider not found: ${riderProfileId}`);
        if (rider.kycStatus !== client_1.KycStatus.APPROVED) {
            throw new common_1.BadRequestException('Rider KYC is not approved');
        }
        if (rider.status !== client_1.RiderStatus.ONLINE) {
            throw new common_1.BadRequestException('Rider must be ONLINE');
        }
        if (rider.user.status === client_1.UserStatus.SUSPENDED || rider.user.deletedAt) {
            throw new common_1.BadRequestException('Rider account is suspended or inactive');
        }
        if (rider.user.status !== client_1.UserStatus.ACTIVE) {
            throw new common_1.BadRequestException('Rider account is not active');
        }
        if (rider.currentLat == null || rider.currentLng == null) {
            throw new common_1.BadRequestException('Rider location is required');
        }
        if (rider._count.deliveries >= rider_assignment_util_1.MAX_ACTIVE_DELIVERIES) {
            throw new common_1.BadRequestException('Rider already has an active delivery');
        }
        const inZone = rider.zones.some((z) => storeZoneIds.includes(z.zoneId));
        if (storeZoneIds.length > 0 && !inZone) {
            throw new common_1.BadRequestException('Rider zone does not match store zone');
        }
    }
    async upsertDelivery(order, riderProfileId, assignedBy) {
        const fulfillmentStoreId = await this.resolveFulfillmentStoreId(order.id, order.store?.id);
        const pickupStore = fulfillmentStoreId && fulfillmentStoreId !== order.store?.id
            ? await this.prisma.store.findUnique({
                where: { id: fulfillmentStoreId },
                select: { latitude: true, longitude: true },
            })
            : null;
        const storeLat = pickupStore?.latitude ?? order.store?.latitude ?? order.delivery?.pickupLat ?? null;
        const storeLng = pickupStore?.longitude ?? order.store?.longitude ?? order.delivery?.pickupLng ?? null;
        const deliveryLat = order.deliveryLat ?? order.delivery?.deliveryLat ?? null;
        const deliveryLng = order.deliveryLng ?? order.delivery?.deliveryLng ?? null;
        const distanceKm = (0, delivery_eta_util_1.safeDistanceKm)(storeLat, storeLng, deliveryLat, deliveryLng);
        if (order.delivery) {
            return this.prisma.delivery.update({
                where: { id: order.delivery.id },
                data: {
                    riderProfileId,
                    status: client_1.DeliveryStatus.ASSIGNED,
                    assignedAt: new Date(),
                    assignedBy,
                    fulfillmentStoreId: fulfillmentStoreId ?? order.store?.id,
                    ...(distanceKm != null ? { distanceKm, estimatedMins: null } : {}),
                    ...(storeLat != null ? { pickupLat: storeLat } : {}),
                    ...(storeLng != null ? { pickupLng: storeLng } : {}),
                },
            });
        }
        return this.prisma.delivery.create({
            data: {
                orderId: order.id,
                riderProfileId,
                status: client_1.DeliveryStatus.ASSIGNED,
                fulfillmentStoreId: fulfillmentStoreId ?? order.store?.id,
                pickupLat: storeLat ?? 0,
                pickupLng: storeLng ?? 0,
                deliveryLat: deliveryLat ?? 0,
                deliveryLng: deliveryLng ?? 0,
                distanceKm,
                estimatedMins: null,
                assignedAt: new Date(),
                assignedBy,
            },
        });
    }
    async resolveFulfillmentStoreId(orderId, fallbackStoreId) {
        const fo = await this.prisma.fulfillmentOrder.findFirst({
            where: { orderId },
            orderBy: { routingScore: 'asc' },
            select: { fulfillmentStoreId: true },
        });
        return fo?.fulfillmentStoreId ?? fallbackStoreId;
    }
    async createAssignmentRecord(deliveryId, riderProfileId, assignedBy) {
        const expiresAt = new Date(Date.now() + this.autoAcceptSeconds * 1000);
        await this.prisma.deliveryAssignment.create({
            data: {
                deliveryId,
                riderProfileId,
                status: client_1.AssignmentStatus.OFFERED,
                expiresAt,
                assignedBy,
            },
        });
    }
    async finishAssignment(input) {
        await this.statusHistory.transition({
            orderId: input.orderId,
            toStatus: client_1.OrderStatus.RIDER_ASSIGNED,
            actorType: input.actorId === 'system' ? client_1.OrderActorType.SYSTEM : client_1.OrderActorType.ADMIN,
            actorId: input.actorId,
            note: input.isReassignment ? 'Rider reassigned' : 'Rider assigned',
            skipIfAlreadyStatus: false,
        });
        await this.prisma.riderProfile.update({
            where: { id: input.riderProfileId },
            data: { status: client_1.RiderStatus.BUSY },
        });
        await Promise.all([
            this.audit.log({
                actorId: input.actorId,
                action: input.isReassignment ? 'RIDER_REASSIGNED' : 'RIDER_ASSIGNED',
                resourceType: 'delivery',
                resourceId: input.deliveryId,
                ipAddress: input.ipAddress,
                metadata: {
                    orderId: input.orderId,
                    orderNumber: input.orderNumber,
                    riderProfileId: input.riderProfileId,
                },
            }),
            this.domainEvents.emit(client_1.DomainEventType.RIDER_ASSIGNED, 'delivery', input.deliveryId, {
                orderId: input.orderId,
                riderProfileId: input.riderProfileId,
                isReassignment: input.isReassignment,
            }, { userId: input.actorId, ipAddress: input.ipAddress ?? null }),
        ]);
        await this.cache.invalidateAssignmentCaches(input.orderId);
        if (!input.isReassignment) {
            void this.buyerPush.notifyRiderAssigned(input.orderId).catch(() => { });
        }
        this.emitWs(input.event, {
            orderId: input.orderId,
            deliveryId: input.deliveryId,
            riderProfileId: input.riderProfileId,
        });
    }
    emitWs(event, payload) {
        this.events.emit(`ws.${event}`, payload);
    }
};
exports.RiderAssignmentService = RiderAssignmentService;
exports.RiderAssignmentService = RiderAssignmentService = RiderAssignmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        domain_events_service_1.DomainEventsService,
        order_status_history_service_1.OrderStatusHistoryService,
        rider_assignment_cache_service_1.RiderAssignmentCacheService,
        event_emitter_1.EventEmitter2,
        buyer_push_notification_service_1.BuyerPushNotificationService,
        config_1.ConfigService])
], RiderAssignmentService);
//# sourceMappingURL=rider-assignment.service.js.map