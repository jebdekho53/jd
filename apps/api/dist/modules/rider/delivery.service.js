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
var DeliveryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const rider_assignment_util_1 = require("../rider-assignment/rider-assignment.util");
const audit_service_1 = require("../audit/audit.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const order_delivered_handler_service_1 = require("../order/order-delivered-handler.service");
const reservation_service_1 = require("../checkout/reservation.service");
const order_status_history_service_1 = require("../order/order-status-history.service");
const delivery_tracking_service_1 = require("../delivery-tracking/delivery-tracking.service");
const buyer_push_notification_service_1 = require("../push/buyer-push-notification.service");
const DELIVERY_NEXT = {
    [client_1.DeliveryStatus.ASSIGNED]: client_1.DeliveryStatus.ACCEPTED,
    [client_1.DeliveryStatus.ACCEPTED]: client_1.DeliveryStatus.ARRIVED_AT_STORE,
    [client_1.DeliveryStatus.ARRIVED_AT_STORE]: client_1.DeliveryStatus.PICKED_UP,
    [client_1.DeliveryStatus.PICKED_UP]: client_1.DeliveryStatus.ARRIVED_AT_CUSTOMER,
    [client_1.DeliveryStatus.ARRIVED_AT_CUSTOMER]: client_1.DeliveryStatus.DELIVERED,
};
const TERMINAL_DELIVERY = new Set([
    client_1.DeliveryStatus.DELIVERED,
    client_1.DeliveryStatus.FAILED,
    client_1.DeliveryStatus.CANCELLED,
    client_1.DeliveryStatus.REJECTED,
]);
const DELIVERY_TO_ORDER_STATUS = {
    [client_1.DeliveryStatus.PICKED_UP]: client_1.OrderStatus.PICKED_UP,
    [client_1.DeliveryStatus.DELIVERED]: client_1.OrderStatus.DELIVERED,
};
const DELIVERY_MILESTONE = {
    [client_1.DeliveryStatus.ARRIVED_AT_STORE]: 'ARRIVED_AT_STORE',
    [client_1.DeliveryStatus.ARRIVED_AT_CUSTOMER]: 'ARRIVED_AT_CUSTOMER',
};
const AUDIT_ACTIONS = {
    [client_1.DeliveryStatus.ACCEPTED]: 'RIDER_ACCEPTED',
    [client_1.DeliveryStatus.PICKED_UP]: 'RIDER_PICKED_UP',
    [client_1.DeliveryStatus.DELIVERED]: 'RIDER_DELIVERED',
};
let DeliveryService = DeliveryService_1 = class DeliveryService {
    constructor(prisma, audit, domainEvents, orderDelivered, reservation, statusHistory, tracking, buyerPush) {
        this.prisma = prisma;
        this.audit = audit;
        this.domainEvents = domainEvents;
        this.orderDelivered = orderDelivered;
        this.reservation = reservation;
        this.statusHistory = statusHistory;
        this.tracking = tracking;
        this.buyerPush = buyerPush;
        this.logger = new common_1.Logger(DeliveryService_1.name);
    }
    async getRiderDeliveries(userId) {
        const riderProfile = await this.requireRiderProfile(userId);
        return this.prisma.delivery.findMany({
            where: {
                riderProfileId: riderProfile.id,
                status: { in: (0, rider_assignment_util_1.activeDeliveryStatuses)() },
            },
            orderBy: { updatedAt: 'desc' },
            take: 20,
            include: {
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        status: true,
                        paymentMethod: true,
                        totalAmount: true,
                        deliveryAddress: true,
                        buyerNote: true,
                        store: { select: { id: true, name: true, latitude: true, longitude: true, phone: true } },
                    },
                },
            },
        });
    }
    async getRiderDeliveryByOrderId(userId, orderId) {
        const riderProfile = await this.requireRiderProfile(userId);
        const delivery = await this.prisma.delivery.findFirst({
            where: { orderId, riderProfileId: riderProfile.id },
            include: {
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        status: true,
                        paymentMethod: true,
                        totalAmount: true,
                        deliveryAddress: true,
                        deliveryLat: true,
                        deliveryLng: true,
                        buyerNote: true,
                        store: { select: { id: true, name: true, latitude: true, longitude: true, phone: true } },
                        items: { select: { productName: true, variantName: true, quantity: true } },
                    },
                },
                assignments: { orderBy: { offeredAt: 'desc' }, take: 1 },
            },
        });
        if (!delivery)
            throw new common_1.NotFoundException('Delivery not found or not assigned to you');
        return delivery;
    }
    async acceptDelivery(userId, orderId, ipAddress) {
        const delivery = await this.requireRiderOwnershipByOrder(userId, orderId);
        if (delivery.status !== client_1.DeliveryStatus.ASSIGNED) {
            throw new common_1.BadRequestException(`Cannot accept: delivery is in status ${delivery.status}. Expected: ASSIGNED`);
        }
        const acceptableOrderStatuses = new Set([client_1.OrderStatus.READY_FOR_PICKUP, client_1.OrderStatus.RIDER_ASSIGNED]);
        if (!acceptableOrderStatuses.has(delivery.order.status)) {
            throw new common_1.BadRequestException('Order is no longer available for acceptance');
        }
        await this.applyTransition(delivery, client_1.DeliveryStatus.ACCEPTED, userId, ipAddress);
        return { deliveryId: delivery.id, status: client_1.DeliveryStatus.ACCEPTED };
    }
    async arrivedAtStore(userId, orderId, ipAddress) {
        const delivery = await this.requireRiderOwnershipByOrder(userId, orderId);
        this.assertCanAdvance(delivery.status, client_1.DeliveryStatus.ARRIVED_AT_STORE);
        await this.applyTransition(delivery, client_1.DeliveryStatus.ARRIVED_AT_STORE, userId, ipAddress);
        return { deliveryId: delivery.id, status: client_1.DeliveryStatus.ARRIVED_AT_STORE };
    }
    async pickedUp(userId, orderId, ipAddress) {
        const delivery = await this.requireRiderOwnershipByOrder(userId, orderId);
        this.assertCanAdvance(delivery.status, client_1.DeliveryStatus.PICKED_UP);
        await this.applyTransition(delivery, client_1.DeliveryStatus.PICKED_UP, userId, ipAddress);
        return { deliveryId: delivery.id, status: client_1.DeliveryStatus.PICKED_UP };
    }
    async arrivedAtCustomer(userId, orderId, ipAddress) {
        const delivery = await this.requireRiderOwnershipByOrder(userId, orderId);
        this.assertCanAdvance(delivery.status, client_1.DeliveryStatus.ARRIVED_AT_CUSTOMER);
        await this.applyTransition(delivery, client_1.DeliveryStatus.ARRIVED_AT_CUSTOMER, userId, ipAddress);
        return { deliveryId: delivery.id, status: client_1.DeliveryStatus.ARRIVED_AT_CUSTOMER };
    }
    async markDelivered(userId, orderId, ipAddress) {
        const delivery = await this.requireRiderOwnershipByOrder(userId, orderId);
        this.assertCanAdvance(delivery.status, client_1.DeliveryStatus.DELIVERED);
        await this.applyTransition(delivery, client_1.DeliveryStatus.DELIVERED, userId, ipAddress);
        return { deliveryId: delivery.id, status: client_1.DeliveryStatus.DELIVERED };
    }
    async markFailed(userId, orderId, reason, ipAddress) {
        const delivery = await this.requireRiderOwnershipByOrder(userId, orderId);
        if (TERMINAL_DELIVERY.has(delivery.status)) {
            throw new common_1.BadRequestException(`Delivery already in terminal status: ${delivery.status}`);
        }
        const riderProfile = await this.prisma.riderProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        await this.prisma.$transaction([
            this.prisma.delivery.update({
                where: { id: delivery.id },
                data: { status: client_1.DeliveryStatus.FAILED },
            }),
            this.prisma.order.update({
                where: { id: delivery.orderId },
                data: { status: client_1.OrderStatus.DELIVERY_FAILED },
            }),
            this.prisma.orderStatusHistory.create({
                data: {
                    orderId: delivery.orderId,
                    status: client_1.OrderStatus.DELIVERY_FAILED,
                    note: reason ?? 'Delivery failed',
                    changedBy: userId,
                },
            }),
            this.prisma.riderProfile.update({
                where: { id: riderProfile.id },
                data: { status: client_1.RiderStatus.ONLINE },
            }),
        ]);
        await Promise.all([
            this.audit.log({
                actorId: userId,
                action: 'DELIVERY_FAILED',
                resourceType: 'delivery',
                resourceId: delivery.id,
                ipAddress,
                metadata: { orderId: delivery.orderId, reason },
            }),
            this.domainEvents.emit(client_1.DomainEventType.DELIVERY_FAILED, 'delivery', delivery.id, { orderId: delivery.orderId, reason }, { userId, ipAddress: ipAddress ?? null }),
        ]);
        return { deliveryId: delivery.id, status: client_1.DeliveryStatus.FAILED };
    }
    async applyTransition(delivery, toStatus, actorId, ipAddress) {
        const now = new Date();
        const riderProfileId = delivery.riderProfileId;
        const orderStatusUpdate = DELIVERY_TO_ORDER_STATUS[toStatus];
        const auditAction = AUDIT_ACTIONS[toStatus];
        const deliveryData = {
            status: toStatus,
            ...(toStatus === client_1.DeliveryStatus.ARRIVED_AT_STORE && { arrivedAtStoreAt: now }),
            ...(toStatus === client_1.DeliveryStatus.PICKED_UP && { pickedUpAt: now }),
            ...(toStatus === client_1.DeliveryStatus.ARRIVED_AT_CUSTOMER && { arrivedAtCustomerAt: now }),
            ...(toStatus === client_1.DeliveryStatus.DELIVERED && { deliveredAt: now }),
        };
        await this.prisma.delivery.update({ where: { id: delivery.id }, data: deliveryData });
        const milestone = DELIVERY_MILESTONE[toStatus];
        if (milestone) {
            const order = await this.prisma.order.findUnique({
                where: { id: delivery.orderId },
                select: { status: true },
            });
            if (order) {
                await this.statusHistory.appendEntry({
                    orderId: delivery.orderId,
                    status: order.status,
                    actorType: client_1.OrderActorType.RIDER,
                    actorId,
                    note: `Delivery milestone: ${milestone}`,
                    metadata: { milestone },
                });
            }
        }
        if (orderStatusUpdate) {
            await this.statusHistory.transition({
                orderId: delivery.orderId,
                toStatus: orderStatusUpdate,
                actorType: client_1.OrderActorType.RIDER,
                actorId,
                note: `Delivery: ${toStatus}`,
                skipIfAlreadyStatus: true,
            });
        }
        if (toStatus === client_1.DeliveryStatus.DELIVERED) {
            await this.prisma.riderProfile.update({
                where: { id: riderProfileId },
                data: {
                    status: client_1.RiderStatus.ONLINE,
                    totalDeliveries: { increment: 1 },
                },
            });
        }
        if (toStatus === client_1.DeliveryStatus.ACCEPTED) {
            await this.prisma.deliveryAssignment.updateMany({
                where: {
                    deliveryId: delivery.id,
                    riderProfileId,
                    status: client_1.AssignmentStatus.OFFERED,
                },
                data: { status: client_1.AssignmentStatus.ACCEPTED, respondedAt: now },
            });
            await this.prisma.riderProfile.update({
                where: { id: riderProfileId },
                data: { status: client_1.RiderStatus.ON_DELIVERY },
            });
        }
        if (auditAction) {
            void this.audit.log({
                actorId,
                action: auditAction,
                resourceType: 'delivery',
                resourceId: delivery.id,
                ipAddress,
                metadata: { orderId: delivery.orderId, newStatus: toStatus },
            });
        }
        const eventType = this.toDomainEvent(toStatus);
        if (eventType) {
            void this.domainEvents.emit(eventType, 'delivery', delivery.id, { orderId: delivery.orderId, riderProfileId }, { userId: actorId, ipAddress: ipAddress ?? null });
        }
        if (toStatus === client_1.DeliveryStatus.PICKED_UP) {
            void this.buyerPush.notifyOutForDelivery(delivery.orderId).catch(() => { });
        }
        if (toStatus === client_1.DeliveryStatus.DELIVERED) {
            void this.orderDelivered.handleDelivered({
                orderId: delivery.orderId,
                actorId,
                riderProfileId,
                deliveryId: delivery.id,
            }).catch((err) => {
                this.logger.error({ err, orderId: delivery.orderId }, 'Order delivered handler failed');
            });
        }
        const orderMeta = await this.prisma.order.findUnique({
            where: { id: delivery.orderId },
            select: { orderNumber: true, storeId: true, status: true },
        });
        if (orderMeta) {
            this.tracking.emitOrderStatus({
                orderId: delivery.orderId,
                orderNumber: orderMeta.orderNumber,
                storeId: orderMeta.storeId,
                riderProfileId,
                orderStatus: orderMeta.status,
                deliveryStatus: toStatus,
            });
            if (toStatus === client_1.DeliveryStatus.ACCEPTED || toStatus === client_1.DeliveryStatus.PICKED_UP) {
                this.tracking.emitDeliveryEvent('STARTED', {
                    orderId: delivery.orderId,
                    orderNumber: orderMeta.orderNumber,
                    storeId: orderMeta.storeId,
                    riderProfileId,
                    deliveryStatus: toStatus,
                    orderStatus: orderMeta.status,
                });
            }
            if (toStatus === client_1.DeliveryStatus.ARRIVED_AT_STORE ||
                toStatus === client_1.DeliveryStatus.ARRIVED_AT_CUSTOMER) {
                this.tracking.emitDeliveryEvent('ARRIVED', {
                    orderId: delivery.orderId,
                    orderNumber: orderMeta.orderNumber,
                    storeId: orderMeta.storeId,
                    riderProfileId,
                    deliveryStatus: toStatus,
                    orderStatus: orderMeta.status,
                });
            }
            if (toStatus === client_1.DeliveryStatus.DELIVERED) {
                this.tracking.emitDeliveryEvent('COMPLETED', {
                    orderId: delivery.orderId,
                    orderNumber: orderMeta.orderNumber,
                    storeId: orderMeta.storeId,
                    riderProfileId,
                    deliveryStatus: toStatus,
                    orderStatus: orderMeta.status,
                });
            }
        }
        this.logger.log({ deliveryId: delivery.id, toStatus }, 'Delivery status advanced');
    }
    assertCanAdvance(current, to) {
        if (TERMINAL_DELIVERY.has(current)) {
            throw new common_1.BadRequestException(`Delivery is in terminal status: ${current}`);
        }
        const expected = DELIVERY_NEXT[current];
        if (expected !== to) {
            throw new common_1.BadRequestException(`Invalid transition: ${current} → ${to}. Expected: ${expected ?? 'none'}`);
        }
    }
    toDomainEvent(status) {
        const map = {
            [client_1.DeliveryStatus.ACCEPTED]: client_1.DomainEventType.RIDER_ACCEPTED,
            [client_1.DeliveryStatus.PICKED_UP]: client_1.DomainEventType.ORDER_PICKED_UP,
            [client_1.DeliveryStatus.DELIVERED]: client_1.DomainEventType.ORDER_DELIVERED,
        };
        return map[status] ?? null;
    }
    async requireRiderProfile(userId) {
        const rp = await this.prisma.riderProfile.findUnique({
            where: { userId },
            select: { id: true, status: true, kycStatus: true },
        });
        if (!rp)
            throw new common_1.NotFoundException('Rider profile not found');
        if (rp.kycStatus !== client_1.KycStatus.APPROVED) {
            throw new common_1.ForbiddenException('Rider KYC not approved');
        }
        return rp;
    }
    async requireRiderOwnershipByOrder(userId, orderId) {
        const rp = await this.requireRiderProfile(userId);
        const delivery = await this.prisma.delivery.findFirst({
            where: { orderId, riderProfileId: rp.id },
            select: {
                id: true,
                orderId: true,
                status: true,
                riderProfileId: true,
                order: { select: { status: true } },
            },
        });
        if (!delivery)
            throw new common_1.ForbiddenException('Delivery not assigned to you');
        return delivery;
    }
};
exports.DeliveryService = DeliveryService;
exports.DeliveryService = DeliveryService = DeliveryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        domain_events_service_1.DomainEventsService,
        order_delivered_handler_service_1.OrderDeliveredHandlerService,
        reservation_service_1.ReservationService,
        order_status_history_service_1.OrderStatusHistoryService,
        delivery_tracking_service_1.DeliveryTrackingService,
        buyer_push_notification_service_1.BuyerPushNotificationService])
], DeliveryService);
//# sourceMappingURL=delivery.service.js.map