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
var OrderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const order_cache_service_1 = require("./order-cache.service");
const order_status_history_service_1 = require("./order-status-history.service");
const merchant_order_visibility_util_1 = require("./merchant-order-visibility.util");
const merchant_forward_util_1 = require("./merchant-forward.util");
const order_status_groups_1 = require("./order-status-groups");
const merchant_pipeline_util_1 = require("./merchant-pipeline.util");
const ist_day_util_1 = require("../../common/utils/ist-day.util");
const delivery_dispatch_service_1 = require("../logistics/delivery-dispatch.service");
const reservation_service_1 = require("../checkout/reservation.service");
const order_refund_service_1 = require("../payment/order-refund.service");
const buyer_push_notification_service_1 = require("../push/buyer-push-notification.service");
const delivery_tracking_service_1 = require("../delivery-tracking/delivery-tracking.service");
const delivery_eta_util_1 = require("../../common/utils/delivery-eta.util");
const MERCHANT_FORWARD = {
    [client_1.OrderStatus.CREATED]: client_1.OrderStatus.MERCHANT_ACCEPTED,
    [client_1.OrderStatus.PAID]: client_1.OrderStatus.MERCHANT_ACCEPTED,
    [client_1.OrderStatus.MERCHANT_ACCEPTED]: client_1.OrderStatus.PREPARING,
    [client_1.OrderStatus.PREPARING]: client_1.OrderStatus.PACKING,
    [client_1.OrderStatus.PACKING]: client_1.OrderStatus.READY_FOR_PICKUP,
};
const BUYER_CANCELLABLE = new Set([
    client_1.OrderStatus.PAYMENT_PENDING,
    client_1.OrderStatus.PAID,
]);
const MERCHANT_CANCELLABLE = new Set([
    client_1.OrderStatus.PAYMENT_PENDING,
    client_1.OrderStatus.PAID,
    client_1.OrderStatus.MERCHANT_ACCEPTED,
    client_1.OrderStatus.PREPARING,
    client_1.OrderStatus.PACKING,
]);
const TERMINAL = new Set([
    client_1.OrderStatus.DELIVERED,
    client_1.OrderStatus.COMPLETED,
    client_1.OrderStatus.CANCELLED_BY_BUYER,
    client_1.OrderStatus.CANCELLED_BY_MERCHANT,
    client_1.OrderStatus.CANCELLED_BY_ADMIN,
    client_1.OrderStatus.PAYMENT_FAILED,
    client_1.OrderStatus.REFUNDED,
]);
const ADMIN_STATUS_GROUPS = {
    pending: [
        client_1.OrderStatus.PAYMENT_PENDING,
        client_1.OrderStatus.PAID,
        client_1.OrderStatus.CREATED,
        client_1.OrderStatus.MERCHANT_ACCEPTED,
    ],
    preparing: [client_1.OrderStatus.PREPARING, client_1.OrderStatus.PACKING],
    ready_for_pickup: [client_1.OrderStatus.READY_FOR_PICKUP],
    assigned: [client_1.OrderStatus.RIDER_ASSIGNED, client_1.OrderStatus.PICKED_UP, client_1.OrderStatus.OUT_FOR_DELIVERY],
    delivered: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.COMPLETED],
    cancelled: [
        client_1.OrderStatus.CANCELLED_BY_BUYER,
        client_1.OrderStatus.CANCELLED_BY_MERCHANT,
        client_1.OrderStatus.CANCELLED_BY_ADMIN,
    ],
};
const ORDER_DETAIL_SELECT = {
    id: true,
    orderNumber: true,
    status: true,
    paymentMethod: true,
    paymentStatus: true,
    subtotal: true,
    discountAmount: true,
    deliveryFee: true,
    taxAmount: true,
    totalAmount: true,
    deliveryAddress: true,
    deliveryLat: true,
    deliveryLng: true,
    buyerNote: true,
    cancelReason: true,
    paidAt: true,
    completedAt: true,
    cancelledAt: true,
    createdAt: true,
    updatedAt: true,
    store: {
        select: {
            id: true,
            name: true,
            slug: true,
            phone: true,
            latitude: true,
            longitude: true,
            merchantProfile: { select: { id: true, businessName: true } },
        },
    },
    buyerProfile: {
        select: {
            id: true,
            name: true,
            user: { select: { phone: true } },
        },
    },
    items: {
        select: {
            id: true,
            productName: true,
            variantName: true,
            sku: true,
            quantity: true,
            unitPrice: true,
            discount: true,
            totalPrice: true,
        },
    },
    statusHistory: {
        select: {
            status: true,
            note: true,
            changedBy: true,
            actorType: true,
            metadata: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
    },
    payment: { select: { razorpayOrderId: true, razorpayPaymentId: true, status: true, method: true } },
    review: {
        select: {
            id: true,
            rating: true,
            storeExperience: true,
            deliveryExperience: true,
            productQuality: true,
            title: true,
            comment: true,
            images: true,
            verifiedPurchase: true,
            merchantReply: true,
            merchantRepliedAt: true,
            createdAt: true,
            updatedAt: true,
        },
    },
    delivery: {
        select: {
            id: true,
            status: true,
            pickupLat: true,
            pickupLng: true,
            deliveryLat: true,
            deliveryLng: true,
            distanceKm: true,
            estimatedMins: true,
            estimatedArrivalAt: true,
            riderProfileId: true,
            assignedAt: true,
            arrivedAtStoreAt: true,
            pickedUpAt: true,
            arrivedAtCustomerAt: true,
            deliveredAt: true,
            riderProfile: {
                select: {
                    id: true,
                    name: true,
                    vehicleType: true,
                    status: true,
                    currentLat: true,
                    currentLng: true,
                    lastLocationAt: true,
                    user: { select: { phone: true } },
                },
            },
            assignments: {
                select: {
                    id: true,
                    status: true,
                    offeredAt: true,
                    respondedAt: true,
                    expiresAt: true,
                    riderProfile: { select: { id: true, name: true } },
                },
                orderBy: { offeredAt: 'asc' },
            },
        },
    },
};
let OrderService = OrderService_1 = class OrderService {
    constructor(prisma, audit, domainEvents, cache, statusHistory, deliveryDispatch, reservation, orderRefunds, buyerPush, deliveryTracking) {
        this.prisma = prisma;
        this.audit = audit;
        this.domainEvents = domainEvents;
        this.cache = cache;
        this.statusHistory = statusHistory;
        this.deliveryDispatch = deliveryDispatch;
        this.reservation = reservation;
        this.orderRefunds = orderRefunds;
        this.buyerPush = buyerPush;
        this.deliveryTracking = deliveryTracking;
        this.logger = new common_1.Logger(OrderService_1.name);
    }
    async listBuyerOrders(userId, dto) {
        const bp = await this.requireBuyerProfile(userId);
        const { page = 1, limit = 20, status, statusGroup } = dto;
        const skip = (page - 1) * limit;
        const where = {
            buyerProfileId: bp.id,
            ...(status && { status }),
            ...(statusGroup && !status && { status: { in: [...order_status_groups_1.BUYER_STATUS_GROUPS[statusGroup]] } }),
        };
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    paymentMethod: true,
                    paymentStatus: true,
                    totalAmount: true,
                    createdAt: true,
                    store: { select: { name: true, slug: true } },
                    items: { select: { productName: true, quantity: true }, take: 3 },
                },
            }),
            this.prisma.order.count({ where }),
        ]);
        this.logger.log(`listBuyerOrders buyer=${bp.id} status=${status ?? 'all'} → ${total} orders`);
        return {
            orders: orders.map(serializeListItem),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async onModuleInit() {
        void this.auditActiveDeliveryCoordinates();
    }
    async getBuyerOrder(userId, orderId) {
        const bp = await this.requireBuyerProfile(userId);
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, buyerProfileId: bp.id },
            select: ORDER_DETAIL_SELECT,
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        this.logDeliveryCoordinateWarnings(order);
        const view = serializeDetail(order);
        void this.cache.setDetail(orderId, view);
        return view;
    }
    logDeliveryCoordinateWarnings(order) {
        if (!order.delivery)
            return;
        const warnings = (0, delivery_eta_util_1.auditDeliveryCoordinates)({
            orderId: order.id,
            orderNumber: order.orderNumber,
            orderStatus: order.status,
            storeLat: order.store?.latitude,
            storeLng: order.store?.longitude,
            customerLat: order.deliveryLat,
            customerLng: order.deliveryLng,
            riderLat: order.delivery.riderProfile?.currentLat,
            riderLng: order.delivery.riderProfile?.currentLng,
            deliveryDistanceKm: order.delivery.distanceKm != null ? Number(order.delivery.distanceKm) : null,
        });
        for (const warning of warnings) {
            this.logger.warn(`[delivery-coord-audit] ${warning}`);
        }
    }
    async auditActiveDeliveryCoordinates() {
        const orders = await this.prisma.order.findMany({
            where: {
                status: {
                    in: [
                        client_1.OrderStatus.RIDER_ASSIGNED,
                        client_1.OrderStatus.PICKED_UP,
                        client_1.OrderStatus.OUT_FOR_DELIVERY,
                    ],
                },
                delivery: { isNot: null },
            },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                deliveryLat: true,
                deliveryLng: true,
                store: { select: { latitude: true, longitude: true } },
                delivery: {
                    select: {
                        distanceKm: true,
                        riderProfile: { select: { currentLat: true, currentLng: true } },
                    },
                },
            },
            take: 500,
        });
        let issueCount = 0;
        for (const order of orders) {
            const warnings = (0, delivery_eta_util_1.auditDeliveryCoordinates)({
                orderId: order.id,
                orderNumber: order.orderNumber,
                orderStatus: order.status,
                storeLat: order.store?.latitude,
                storeLng: order.store?.longitude,
                customerLat: order.deliveryLat,
                customerLng: order.deliveryLng,
                riderLat: order.delivery?.riderProfile?.currentLat,
                riderLng: order.delivery?.riderProfile?.currentLng,
                deliveryDistanceKm: order.delivery?.distanceKm != null ? Number(order.delivery.distanceKm) : null,
            });
            for (const warning of warnings) {
                issueCount += 1;
                this.logger.warn(`[delivery-coord-audit] ${warning}`);
            }
        }
        if (issueCount > 0) {
            this.logger.warn(`[delivery-coord-audit] Found ${issueCount} coordinate issue(s) across ${orders.length} active delivery order(s)`);
        }
    }
    async cancelByBuyer(userId, orderId, dto, ipAddress) {
        const bp = await this.requireBuyerProfile(userId);
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, buyerProfileId: bp.id },
            select: { id: true, status: true, paymentMethod: true, paymentStatus: true, orderNumber: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (!BUYER_CANCELLABLE.has(order.status)) {
            throw new common_1.BadRequestException(`Order cannot be cancelled in status: ${order.status}. ` +
                `Buyer cancellation is only allowed before the merchant confirms the order (PAID).`);
        }
        const newStatus = client_1.OrderStatus.CANCELLED_BY_BUYER;
        await this.statusHistory.transition({
            orderId: order.id,
            toStatus: newStatus,
            actorType: client_1.OrderActorType.BUYER,
            actorId: userId,
            note: dto.reason,
        });
        await this.reservation.releaseOrderReservations(order.id, userId);
        if (order.paymentStatus === client_1.PaymentStatus.PAID) {
            await this.orderRefunds.initiateRefund({
                orderId: order.id,
                actorId: userId,
                initiatorType: client_1.OrderRefundInitiator.BUYER,
                reason: dto.reason,
                ipAddress,
            });
        }
        void this.cache.invalidateAll(orderId);
        this.logger.log({ userId, orderId, orderNumber: order.orderNumber }, 'Order cancelled by buyer');
        return { orderId, status: newStatus };
    }
    async listMerchantOrders(userId, dto) {
        const storeIds = await this.getMerchantStoreIds(userId);
        if (storeIds.length === 0)
            return { orders: [], meta: { page: dto.page ?? 1, limit: dto.limit ?? 20, total: 0, totalPages: 0 } };
        const { page = 1, limit = 20, status, storeId, merchantStatusGroup, pipelineColumn, today, yesterday, dateFrom, dateTo, paymentMethod, q, } = dto;
        const skip = (page - 1) * limit;
        const targetStoreIds = storeId
            ? (storeIds.includes(storeId) ? [storeId] : (() => { throw new common_1.ForbiddenException('Store does not belong to you'); })())
            : storeIds;
        const group = merchantStatusGroup;
        const dayFilter = (0, ist_day_util_1.merchantOrderDayFilter)({ today, yesterday });
        const visibilityWhere = (0, merchant_order_visibility_util_1.buildMerchantListWhere)({
            status,
            merchantStatusGroup: group,
            pipelineColumn: pipelineColumn,
        });
        const where = {
            storeId: { in: targetStoreIds },
            ...visibilityWhere,
            ...(paymentMethod && { paymentMethod }),
            ...(dayFilter ?? {}),
            ...(dateFrom || dateTo
                ? {
                    createdAt: {
                        ...(dateFrom && { gte: new Date(dateFrom) }),
                        ...(dateTo && { lte: new Date(dateTo) }),
                    },
                }
                : {}),
            ...(q
                ? {
                    OR: [
                        { orderNumber: { contains: q, mode: 'insensitive' } },
                        { buyerProfile: { name: { contains: q, mode: 'insensitive' } } },
                        { buyerProfile: { user: { phone: { contains: q } } } },
                        { items: { some: { OR: [
                                        { productName: { contains: q, mode: 'insensitive' } },
                                        { sku: { contains: q, mode: 'insensitive' } },
                                    ] } } },
                    ],
                }
                : {}),
        };
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    paymentMethod: true,
                    paymentStatus: true,
                    totalAmount: true,
                    createdAt: true,
                    updatedAt: true,
                    storeId: true,
                    deliveryLat: true,
                    deliveryLng: true,
                    buyerProfile: {
                        select: { name: true, user: { select: { phone: true } } },
                    },
                    items: { select: { productName: true, quantity: true, sku: true }, take: 5 },
                    delivery: {
                        select: {
                            status: true,
                            assignedAt: true,
                            riderProfile: {
                                select: {
                                    id: true,
                                    name: true,
                                    user: { select: { phone: true } },
                                },
                            },
                        },
                    },
                    statusHistory: {
                        select: { status: true, createdAt: true },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            }),
            this.prisma.order.count({ where }),
        ]);
        this.logger.log(`listMerchantOrders stores=${targetStoreIds.length} status=${status ?? 'all'} → ${total} orders`);
        return {
            orders: orders.map((o) => serializeMerchantListItem(o)),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async markOrderIssue(userId, orderId, note, ipAddress) {
        await this.requireMerchantOrderOwnership(userId, orderId);
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, status: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (TERMINAL.has(order.status)) {
            throw new common_1.BadRequestException(`Cannot flag issue on terminal order: ${order.status}`);
        }
        await this.statusHistory.appendEntry({
            orderId,
            status: order.status,
            actorType: client_1.OrderActorType.MERCHANT,
            actorId: userId,
            note: note ?? 'Merchant flagged an issue',
            metadata: { issue: true },
        });
        void this.cache.invalidateAll(orderId);
        return { orderId, flagged: true };
    }
    async listAdminOrders(dto) {
        const { page = 1, limit = 20, status, storeId, today, statusGroup, merchantId, riderId, dateFrom, dateTo, paymentMethod, paymentStatus, } = dto;
        const skip = (page - 1) * limit;
        const dayFilter = today ? (0, ist_day_util_1.orderIstDayFilter)({ today: true }) : undefined;
        const where = {
            ...(storeId && { storeId }),
            ...(merchantId && { store: { merchantProfileId: merchantId } }),
            ...(riderId && { delivery: { riderProfileId: riderId } }),
            ...(paymentMethod && { paymentMethod }),
            ...(paymentStatus && { paymentStatus }),
            ...(dayFilter ?? {}),
            ...(dateFrom || dateTo
                ? {
                    createdAt: {
                        ...(dateFrom && { gte: new Date(dateFrom) }),
                        ...(dateTo && { lte: new Date(dateTo) }),
                    },
                }
                : {}),
            ...(status
                ? { status }
                : statusGroup
                    ? { status: { in: [...ADMIN_STATUS_GROUPS[statusGroup]] } }
                    : {}),
        };
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    paymentMethod: true,
                    paymentStatus: true,
                    totalAmount: true,
                    createdAt: true,
                    updatedAt: true,
                    store: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            merchantProfile: { select: { id: true, businessName: true } },
                        },
                    },
                    buyerProfile: { select: { id: true, name: true } },
                    delivery: {
                        select: {
                            status: true,
                            riderProfile: { select: { id: true, name: true } },
                        },
                    },
                },
            }),
            this.prisma.order.count({ where }),
        ]);
        this.logger.log(`listAdminOrders status=${status ?? statusGroup ?? 'all'} today=${Boolean(today)} → ${total} orders`);
        return {
            orders: orders.map((o) => ({
                id: o.id,
                orderNumber: o.orderNumber,
                status: o.status,
                paymentMethod: o.paymentMethod,
                paymentStatus: o.paymentStatus,
                totalAmount: Number(o.totalAmount),
                createdAt: o.createdAt,
                updatedAt: o.updatedAt,
                deliveryStatus: o.delivery?.status ?? null,
                store: o.store
                    ? {
                        id: o.store.id,
                        name: o.store.name,
                        slug: o.store.slug,
                        merchant: o.store.merchantProfile,
                    }
                    : null,
                buyer: o.buyerProfile,
                rider: o.delivery?.riderProfile ?? null,
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getAdminOrder(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: ORDER_DETAIL_SELECT,
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return serializeDetail(order);
    }
    async getMerchantOrder(userId, orderId) {
        await this.requireMerchantOrderOwnership(userId, orderId);
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: ORDER_DETAIL_SELECT,
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const customer = await this.getBuyerStoreStats(order.buyerProfile.id, order.store.id);
        const deliveryBatch = await this.prisma.deliveryBatchItem.findUnique({
            where: { orderId },
            include: {
                batch: {
                    include: {
                        items: { include: { order: { select: { orderNumber: true } } }, orderBy: { sequence: 'asc' } },
                    },
                },
            },
        });
        const fulfillmentBatch = deliveryBatch
            ? {
                isBatched: deliveryBatch.batch.totalOrders > 1,
                batchId: deliveryBatch.batchId,
                batchStatus: deliveryBatch.batch.status,
                sequence: deliveryBatch.sequence,
                totalOrders: deliveryBatch.batch.totalOrders,
                label: deliveryBatch.batch.totalOrders > 1
                    ? `Part of delivery batch (${deliveryBatch.sequence}/${deliveryBatch.batch.totalOrders})`
                    : 'Single order delivery',
                orders: deliveryBatch.batch.items.map((i) => i.order.orderNumber),
            }
            : { isBatched: false, label: 'Single order delivery' };
        const view = {
            ...serializeDetail(order),
            customer,
            operations: buildOrderOperations(order),
            fulfillmentBatch,
        };
        void this.cache.setDetail(orderId, view);
        return view;
    }
    async advanceMerchantOrder(userId, orderId, targetStatus, note, ipAddress) {
        await this.requireMerchantOrderOwnership(userId, orderId);
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, status: true, orderNumber: true, storeId: true, orderVertical: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (TERMINAL.has(order.status)) {
            throw new common_1.BadRequestException(`Order is in a terminal state: ${order.status}`);
        }
        const forwardMap = (0, merchant_forward_util_1.merchantForwardMap)(order.orderVertical);
        const expectedNext = forwardMap[order.status];
        if (!expectedNext || expectedNext !== targetStatus) {
            throw new common_1.BadRequestException(`Invalid transition: ${order.status} → ${targetStatus}. ` +
                `Expected next state: ${expectedNext ?? 'none (terminal)'}`);
        }
        await this.statusHistory.transition({
            orderId: order.id,
            toStatus: targetStatus,
            actorType: client_1.OrderActorType.MERCHANT,
            actorId: userId,
            note,
        });
        if (order.orderVertical === client_1.OrderVertical.FOOD) {
            const kitchenStatus = this.foodKitchenStatusForOrderStatus(targetStatus);
            if (kitchenStatus) {
                await this.prisma.order.update({
                    where: { id: orderId },
                    data: { kitchenStatus },
                });
            }
        }
        const auditActions = {
            [client_1.OrderStatus.MERCHANT_ACCEPTED]: 'ORDER_CONFIRMED',
            [client_1.OrderStatus.PREPARING]: 'ORDER_PREPARING',
            [client_1.OrderStatus.PACKING]: 'ORDER_PACKING',
            [client_1.OrderStatus.READY_FOR_PICKUP]: 'ORDER_READY',
        };
        const domainEventTypes = {
            [client_1.OrderStatus.MERCHANT_ACCEPTED]: client_1.DomainEventType.ORDER_ACCEPTED,
            [client_1.OrderStatus.PREPARING]: client_1.DomainEventType.ORDER_PREPARING,
            [client_1.OrderStatus.PACKING]: client_1.DomainEventType.ORDER_PREPARING,
            [client_1.OrderStatus.READY_FOR_PICKUP]: client_1.DomainEventType.ORDER_READY_FOR_PICKUP,
        };
        await this.audit.log({
            actorId: userId,
            action: auditActions[targetStatus] ?? 'ORDER_STATUS_CHANGED',
            resourceType: 'order',
            resourceId: orderId,
            ipAddress,
            metadata: { from: order.status, to: targetStatus, orderNumber: order.orderNumber },
        });
        const eventType = domainEventTypes[targetStatus];
        if (eventType) {
            void this.domainEvents.emit(eventType, 'order', orderId, { from: order.status, to: targetStatus, storeId: order.storeId }, { userId, ipAddress: ipAddress ?? null });
        }
        if (targetStatus === client_1.OrderStatus.MERCHANT_ACCEPTED) {
            void this.buyerPush.notifyOrderAccepted(orderId).catch(() => { });
        }
        const prepStatuses = new Set([
            client_1.OrderStatus.MERCHANT_ACCEPTED,
            client_1.OrderStatus.PREPARING,
            client_1.OrderStatus.PACKING,
            client_1.OrderStatus.READY_FOR_PICKUP,
        ]);
        if (prepStatuses.has(targetStatus)) {
            this.deliveryTracking.emitOrderStatus({
                orderId: order.id,
                orderNumber: order.orderNumber,
                storeId: order.storeId,
                orderStatus: targetStatus,
            });
        }
        void this.cache.invalidateAll(orderId);
        this.logger.log({ userId, orderId, from: order.status, to: targetStatus }, 'Order status advanced');
        if (targetStatus === client_1.OrderStatus.READY_FOR_PICKUP) {
            void this.buyerPush.notifyReadyForPickup(orderId).catch(() => { });
            void this.deliveryDispatch.dispatchAfterReadyForPickup(orderId).then((result) => {
                if (result?.mode === 'own_fleet') {
                    void this.cache.invalidateAll(orderId);
                    this.logger.log({ orderId, riderProfileId: result.riderProfileId, deliveryId: result.deliveryId }, 'Auto-assigned rider after READY_FOR_PICKUP');
                }
                else if (result?.mode === 'provider') {
                    void this.cache.invalidateAll(orderId);
                    this.logger.log({
                        orderId,
                        deliveryId: result.deliveryId,
                        shipmentId: result.shipmentId,
                        trackingNumber: result.trackingNumber,
                    }, 'Provider shipment created after READY_FOR_PICKUP');
                }
                else {
                    this.logger.warn({ orderId }, 'Dispatch found no provider/rider — order stays READY_FOR_PICKUP');
                }
            }).catch((err) => {
                this.logger.error({ orderId, err }, 'Dispatch failed after READY_FOR_PICKUP');
            });
        }
        return { orderId, status: targetStatus };
    }
    async cancelByMerchant(userId, orderId, dto, ipAddress) {
        await this.requireMerchantOrderOwnership(userId, orderId);
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, status: true, paymentMethod: true, paymentStatus: true, orderNumber: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (!MERCHANT_CANCELLABLE.has(order.status)) {
            throw new common_1.BadRequestException(`Order cannot be cancelled in status: ${order.status}. ` +
                `Merchant cancellation is only allowed before READY_FOR_PICKUP.`);
        }
        const newStatus = client_1.OrderStatus.CANCELLED_BY_MERCHANT;
        await this.statusHistory.transition({
            orderId: order.id,
            toStatus: newStatus,
            actorType: client_1.OrderActorType.MERCHANT,
            actorId: userId,
            note: dto.reason,
        });
        await this.reservation.releaseOrderReservations(order.id, userId);
        if (order.paymentStatus === client_1.PaymentStatus.PAID) {
            await this.orderRefunds.initiateRefund({
                orderId: order.id,
                actorId: userId,
                initiatorType: client_1.OrderRefundInitiator.MERCHANT,
                reason: dto.reason,
                ipAddress,
            });
        }
        void this.cache.invalidateAll(orderId);
        this.logger.log({ userId, orderId, orderNumber: order.orderNumber }, 'Order cancelled by merchant');
        return { orderId, status: newStatus };
    }
    async getBuyerStoreStats(buyerProfileId, storeId) {
        const [agg, buyer] = await Promise.all([
            this.prisma.order.aggregate({
                where: {
                    buyerProfileId,
                    storeId,
                    status: { notIn: [client_1.OrderStatus.CANCELLED_BY_BUYER, client_1.OrderStatus.CANCELLED_BY_MERCHANT, client_1.OrderStatus.CANCELLED_BY_ADMIN] },
                },
                _count: { id: true },
                _sum: { totalAmount: true },
            }),
            this.prisma.buyerProfile.findUnique({
                where: { id: buyerProfileId },
                select: { name: true, user: { select: { phone: true } } },
            }),
        ]);
        return {
            name: buyer?.name ?? null,
            phone: buyer?.user?.phone ?? null,
            orderCount: agg._count.id,
            lifetimeSpend: Number(agg._sum.totalAmount ?? 0),
        };
    }
    async requireBuyerProfile(userId) {
        const bp = await this.prisma.buyerProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!bp)
            throw new common_1.NotFoundException('Buyer profile not found');
        return bp;
    }
    async getMerchantStoreIds(userId) {
        const mp = await this.prisma.merchantProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!mp)
            return [];
        const stores = await this.prisma.store.findMany({
            where: { merchantProfileId: mp.id, deletedAt: null },
            select: { id: true },
        });
        return stores.map((s) => s.id);
    }
    async requireMerchantOrderOwnership(userId, orderId) {
        const storeIds = await this.getMerchantStoreIds(userId);
        if (storeIds.length === 0)
            throw new common_1.ForbiddenException('No merchant stores found');
        const exists = await this.prisma.order.findFirst({
            where: { id: orderId, storeId: { in: storeIds } },
            select: { id: true },
        });
        if (!exists)
            throw new common_1.ForbiddenException('Order does not belong to your store');
    }
    foodKitchenStatusForOrderStatus(status) {
        switch (status) {
            case client_1.OrderStatus.MERCHANT_ACCEPTED:
                return client_1.FoodKitchenStatus.NEW;
            case client_1.OrderStatus.PREPARING:
                return client_1.FoodKitchenStatus.PREPARING;
            case client_1.OrderStatus.READY_FOR_PICKUP:
                return client_1.FoodKitchenStatus.READY;
            case client_1.OrderStatus.DELIVERED:
            case client_1.OrderStatus.COMPLETED:
                return client_1.FoodKitchenStatus.COMPLETED;
            default:
                return null;
        }
    }
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = OrderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        domain_events_service_1.DomainEventsService,
        order_cache_service_1.OrderCacheService,
        order_status_history_service_1.OrderStatusHistoryService,
        delivery_dispatch_service_1.DeliveryDispatchService,
        reservation_service_1.ReservationService,
        order_refund_service_1.OrderRefundService,
        buyer_push_notification_service_1.BuyerPushNotificationService,
        delivery_tracking_service_1.DeliveryTrackingService])
], OrderService);
function serializeListItem(order) {
    return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        totalAmount: Number(order.totalAmount),
        createdAt: order.createdAt,
        store: order.store,
        storeId: order.storeId,
        buyerProfile: order.buyerProfile,
        items: order.items,
    };
}
function serializeMerchantListItem(order) {
    const acceptedAt = order.statusHistory?.find((h) => h.status === 'MERCHANT_ACCEPTED' || h.status === 'PREPARING')?.createdAt;
    const readyAt = order.statusHistory?.find((h) => h.status === 'READY_FOR_PICKUP')?.createdAt;
    const pipelineColumn = (0, merchant_pipeline_util_1.resolvePipelineColumn)(order.status, order.paymentMethod);
    const awaitingRider = order.status === 'READY_FOR_PICKUP' && !order.delivery?.riderProfile;
    const riderWaitMins = awaitingRider && readyAt ? (0, merchant_pipeline_util_1.minutesSince)(readyAt) : 0;
    return {
        ...serializeListItem(order),
        updatedAt: order.updatedAt,
        pipelineColumn,
        buyerProfile: order.buyerProfile
            ? {
                name: order.buyerProfile.name,
                phone: order.buyerProfile.user?.phone ?? null,
            }
            : null,
        rider: order.delivery?.riderProfile
            ? {
                id: order.delivery.riderProfile.id,
                name: order.delivery.riderProfile.name,
                phone: order.delivery.riderProfile.user?.phone ?? null,
            }
            : null,
        deliveryStatus: order.delivery?.status ?? null,
        awaitingRider,
        riderWaitMins,
        operations: {
            orderAgeMins: (0, merchant_pipeline_util_1.minutesSince)(order.createdAt),
            sinceAcceptedMins: acceptedAt ? (0, merchant_pipeline_util_1.minutesSince)(acceptedAt) : null,
            prepSla: acceptedAt
                ? (0, merchant_pipeline_util_1.slaLevel)((0, merchant_pipeline_util_1.minutesSince)(acceptedAt), merchant_pipeline_util_1.SLA_THRESHOLDS.prepare.yellow, merchant_pipeline_util_1.SLA_THRESHOLDS.prepare.red)
                : 'green',
            riderWaitSla: awaitingRider
                ? (0, merchant_pipeline_util_1.slaLevel)(riderWaitMins, merchant_pipeline_util_1.SLA_THRESHOLDS.riderWait.yellow, merchant_pipeline_util_1.SLA_THRESHOLDS.riderWait.red)
                : 'green',
        },
    };
}
function buildOrderOperations(order) {
    const acceptedAt = order.statusHistory?.find((h) => h.status === 'MERCHANT_ACCEPTED' || h.status === 'PREPARING' || h.status === 'PACKING')?.createdAt;
    const packingAt = order.statusHistory?.find((h) => h.status === 'PACKING')?.createdAt;
    const readyAt = order.statusHistory?.find((h) => h.status === 'READY_FOR_PICKUP')?.createdAt;
    const awaitingRider = order.status === 'READY_FOR_PICKUP' && !order.delivery?.riderProfile;
    const riderWaitMins = awaitingRider && readyAt ? (0, merchant_pipeline_util_1.minutesSince)(readyAt) : 0;
    return {
        pipelineColumn: (0, merchant_pipeline_util_1.resolvePipelineColumn)(order.status, order.paymentMethod),
        orderAgeMins: (0, merchant_pipeline_util_1.minutesSince)(order.createdAt),
        sinceAcceptedMins: acceptedAt ? (0, merchant_pipeline_util_1.minutesSince)(acceptedAt) : null,
        sincePackingMins: packingAt ? (0, merchant_pipeline_util_1.minutesSince)(packingAt) : null,
        awaitingRider,
        riderWaitMins,
        prepSla: acceptedAt
            ? (0, merchant_pipeline_util_1.slaLevel)((0, merchant_pipeline_util_1.minutesSince)(acceptedAt), merchant_pipeline_util_1.SLA_THRESHOLDS.prepare.yellow, merchant_pipeline_util_1.SLA_THRESHOLDS.prepare.red)
            : 'green',
        packSla: packingAt
            ? (0, merchant_pipeline_util_1.slaLevel)((0, merchant_pipeline_util_1.minutesSince)(packingAt), merchant_pipeline_util_1.SLA_THRESHOLDS.pack.yellow, merchant_pipeline_util_1.SLA_THRESHOLDS.pack.red)
            : 'green',
        riderWaitSla: awaitingRider
            ? (0, merchant_pipeline_util_1.slaLevel)(riderWaitMins, merchant_pipeline_util_1.SLA_THRESHOLDS.riderWait.yellow, merchant_pipeline_util_1.SLA_THRESHOLDS.riderWait.red)
            : 'green',
    };
}
function serializeDetail(order) {
    const items = order.items.map((i) => ({
        id: i.id,
        productName: i.productName,
        variantName: i.variantName,
        sku: i.sku,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        discount: Number(i.discount),
        totalPrice: Number(i.totalPrice),
    }));
    const statusHistory = order.statusHistory.map((h) => ({
        status: h.status,
        note: h.note,
        changedBy: h.changedBy,
        actorType: h.actorType,
        metadata: h.metadata,
        createdAt: h.createdAt,
    }));
    const delivery = order.delivery ? serializeDelivery(order.delivery, order) : null;
    const timeline = buildEnrichedTimeline(statusHistory, order.delivery, order.status);
    const store = order.store
        ? {
            id: order.store.id,
            name: order.store.name,
            slug: order.store.slug,
            phone: order.store.phone,
            merchant: order.store.merchantProfile
                ? {
                    id: order.store.merchantProfile.id,
                    businessName: order.store.merchantProfile.businessName,
                }
                : null,
        }
        : null;
    return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: Number(order.subtotal),
        discountAmount: Number(order.discountAmount),
        deliveryFee: Number(order.deliveryFee),
        taxAmount: Number(order.taxAmount),
        totalAmount: Number(order.totalAmount),
        deliveryAddress: order.deliveryAddress,
        buyerNote: order.buyerNote,
        cancelReason: order.cancelReason,
        paidAt: order.paidAt,
        completedAt: order.completedAt,
        cancelledAt: order.cancelledAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        store,
        buyerProfile: order.buyerProfile
            ? {
                id: order.buyerProfile.id,
                name: order.buyerProfile.name,
                phone: order.buyerProfile.user?.phone ?? null,
            }
            : null,
        items,
        statusHistory,
        timeline,
        delivery,
        payment: order.payment,
        canReview: order.status === client_1.OrderStatus.DELIVERED || order.status === client_1.OrderStatus.COMPLETED,
        review: order.review
            ? {
                id: order.review.id,
                rating: order.review.rating,
                storeExperience: order.review.storeExperience,
                deliveryExperience: order.review.deliveryExperience,
                productQuality: order.review.productQuality,
                title: order.review.title,
                review: order.review.comment,
                images: order.review.images ?? [],
                verifiedPurchase: order.review.verifiedPurchase,
                merchantReply: order.review.merchantReply,
                merchantRepliedAt: order.review.merchantRepliedAt,
                createdAt: order.review.createdAt,
                updatedAt: order.review.updatedAt,
            }
            : null,
    };
}
function serializeDelivery(delivery, order) {
    const storeLat = order.store?.latitude ?? delivery.pickupLat ?? null;
    const storeLng = order.store?.longitude ?? delivery.pickupLng ?? null;
    const customerLat = order.deliveryLat ?? delivery.deliveryLat ?? null;
    const customerLng = order.deliveryLng ?? delivery.deliveryLng ?? null;
    const hasActiveAssignment = Boolean(delivery.riderProfileId &&
        delivery.riderProfile &&
        (delivery.assignedAt ||
            (delivery.assignments ?? []).some((a) => a.status === 'ACCEPTED')));
    const eta = (0, delivery_eta_util_1.computeDeliveryEta)({
        orderStatus: order.status,
        deliveryStatus: delivery.status,
        storeLat,
        storeLng,
        customerLat,
        customerLng,
        riderLat: delivery.riderProfile?.currentLat,
        riderLng: delivery.riderProfile?.currentLng,
        pickedUpAt: delivery.pickedUpAt,
        hasActiveAssignment,
    });
    const distanceKm = (0, delivery_eta_util_1.safeDistanceKm)(storeLat, storeLng, customerLat, customerLng);
    return {
        id: delivery.id,
        status: delivery.status,
        distanceKm,
        estimatedMins: eta.estimatedMins,
        estimatedArrivalAt: delivery.estimatedArrivalAt ?? null,
        etaAvailable: eta.etaAvailable,
        liveTrackingAvailable: eta.liveTrackingAvailable,
        waitingForPickup: hasActiveAssignment &&
            !delivery.pickedUpAt &&
            !['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(order.status),
        assignedAt: delivery.assignedAt,
        arrivedAtStoreAt: delivery.arrivedAtStoreAt,
        pickedUpAt: delivery.pickedUpAt,
        arrivedAtCustomerAt: delivery.arrivedAtCustomerAt,
        deliveredAt: delivery.deliveredAt,
        rider: delivery.riderProfile
            ? {
                id: delivery.riderProfile.id,
                name: delivery.riderProfile.name,
                phone: delivery.riderProfile.user?.phone ?? null,
                vehicleType: delivery.riderProfile.vehicleType ?? null,
                status: delivery.riderProfile.status,
                currentLat: delivery.riderProfile.currentLat,
                currentLng: delivery.riderProfile.currentLng,
                lastLocationAt: delivery.riderProfile.lastLocationAt,
            }
            : null,
        assignmentTimeline: (delivery.assignments ?? []).map((a) => ({
            id: a.id,
            status: a.status,
            offeredAt: a.offeredAt,
            respondedAt: a.respondedAt,
            expiresAt: a.expiresAt,
            riderName: a.riderProfile?.name ?? null,
        })),
    };
}
function buildEnrichedTimeline(statusHistory, delivery, orderStatus) {
    const pickedUp = delivery?.pickedUpAt != null ||
        orderStatus === 'PICKED_UP' ||
        orderStatus === 'OUT_FOR_DELIVERY' ||
        orderStatus === 'DELIVERED' ||
        orderStatus === 'COMPLETED';
    const entries = statusHistory
        .filter((h) => {
        const status = h.metadata?.milestone ?? h.status;
        if (status === 'OUT_FOR_DELIVERY' && !pickedUp)
            return false;
        return true;
    })
        .map((h) => {
        const milestone = h.metadata?.milestone;
        return {
            ...h,
            status: milestone ?? h.status,
        };
    });
    const hasStatus = (s) => entries.some((e) => e.status === s);
    const deliveryMilestones = [
        { status: 'ARRIVED_AT_STORE', note: 'Rider arrived at store', at: delivery?.arrivedAtStoreAt ?? null },
        { status: 'PICKED_UP', note: 'Order picked up by rider', at: delivery?.pickedUpAt ?? null },
        { status: 'ARRIVED_AT_CUSTOMER', note: 'Rider arrived at customer', at: delivery?.arrivedAtCustomerAt ?? null },
        { status: 'DELIVERED', note: 'Order delivered', at: delivery?.deliveredAt ?? null },
    ];
    for (const m of deliveryMilestones) {
        if (!m.at)
            continue;
        if (m.status === 'DELIVERED' && hasStatus('DELIVERED'))
            continue;
        if (m.status === 'PICKED_UP' && (hasStatus('PICKED_UP') || hasStatus('OUT_FOR_DELIVERY')))
            continue;
        if (hasStatus(m.status))
            continue;
        entries.push({
            status: m.status,
            note: m.note,
            changedBy: null,
            actorType: 'RIDER',
            metadata: null,
            createdAt: m.at,
        });
    }
    return entries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
//# sourceMappingURL=order.service.js.map