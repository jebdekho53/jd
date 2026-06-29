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
var ReservationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationService = exports.RESERVATION_TTL_MINUTES = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const inventory_service_1 = require("../inventory/inventory.service");
const order_cache_service_1 = require("../order/order-cache.service");
const order_status_history_service_1 = require("../order/order-status-history.service");
const distributed_lock_service_1 = require("../../redis/distributed-lock.service");
exports.RESERVATION_TTL_MINUTES = 15;
let ReservationService = ReservationService_1 = class ReservationService {
    constructor(prisma, audit, domainEvents, inventory, statusHistory, orderCache, lock) {
        this.prisma = prisma;
        this.audit = audit;
        this.domainEvents = domainEvents;
        this.inventory = inventory;
        this.statusHistory = statusHistory;
        this.orderCache = orderCache;
        this.lock = lock;
        this.logger = new common_1.Logger(ReservationService_1.name);
    }
    async reserveInventory(checkoutId, items, userId, ipAddress) {
        const expiresAt = new Date(Date.now() + exports.RESERVATION_TTL_MINUTES * 60 * 1000);
        await this.inventory.reserveForCheckout(checkoutId, items, expiresAt);
        void this.domainEvents.emit(client_1.DomainEventType.INVENTORY_RESERVED, 'checkout', checkoutId, { items, expiresAt }, { userId, ipAddress: ipAddress ?? null });
        this.logger.log({ checkoutId, itemCount: items.length }, 'Inventory reserved');
    }
    async linkReservationsToOrder(checkoutId, orderId) {
        await this.inventory.linkReservationsToOrder(checkoutId, orderId);
    }
    async releaseReservations(checkoutId, reason, userId) {
        await this.inventory.releaseByCheckout(checkoutId, reason);
        void this.domainEvents.emit(client_1.DomainEventType.INVENTORY_RELEASED, 'checkout', checkoutId, { reason }, { userId: userId ?? 'system', ipAddress: null });
        this.logger.log({ checkoutId, reason }, 'Reservations released');
    }
    async releaseOrderReservations(orderId, userId) {
        await this.inventory.releaseByOrder(orderId);
        void this.domainEvents.emit(client_1.DomainEventType.INVENTORY_RELEASED, 'order', orderId, { reason: 'ORDER_CANCELLED' }, { userId: userId ?? 'system', ipAddress: null });
    }
    async consumeReservations(checkoutId) {
        const checkout = await this.prisma.checkout.findUnique({
            where: { id: checkoutId },
            select: { orderId: true },
        });
        if (checkout?.orderId) {
            await this.linkReservationsToOrder(checkoutId, checkout.orderId);
        }
        this.logger.debug({ checkoutId }, 'consumeReservations noop — stock held until delivery');
    }
    async fulfillOnDelivery(orderId) {
        await this.inventory.fulfillOnDelivery(orderId);
        this.logger.log({ orderId }, 'Inventory fulfilled on delivery');
    }
    async releaseExpiredReservations() {
        await this.lock.runExclusive('cron:inventory-release', 50, async () => {
            await this.releaseExpiredReservationsInner();
        });
    }
    async releaseExpiredReservationsInner() {
        const now = new Date();
        const expiredCheckouts = await this.prisma.checkout.findMany({
            where: {
                status: { in: ['INITIATED', 'RESERVED'] },
                reservations: {
                    some: { status: client_1.ReservationStatus.ACTIVE, expiresAt: { lte: now } },
                },
            },
            select: { id: true, buyerProfileId: true, orderId: true },
        });
        if (expiredCheckouts.length === 0) {
            await this.cancelStalePaymentPendingOrders();
            return;
        }
        this.logger.warn({ count: expiredCheckouts.length }, 'Releasing expired inventory reservations');
        for (const checkout of expiredCheckouts) {
            try {
                await this.releaseReservations(checkout.id, 'EXPIRED');
                await this.prisma.checkout.update({
                    where: { id: checkout.id },
                    data: { status: 'EXPIRED' },
                });
                await this.audit.log({
                    actorId: 'system',
                    action: 'RESERVATION_EXPIRED',
                    resourceType: 'checkout',
                    resourceId: checkout.id,
                    metadata: { buyerProfileId: checkout.buyerProfileId },
                });
                if (checkout.orderId) {
                    await this.cancelExpiredPendingOrder(checkout.orderId);
                }
            }
            catch (err) {
                this.logger.error({ checkoutId: checkout.id, error: err.message }, 'Failed to release expired reservation');
            }
        }
        await this.cancelStalePaymentPendingOrders();
    }
    async cancelExpiredPendingOrder(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, status: true },
        });
        if (!order || order.status !== client_1.OrderStatus.PAYMENT_PENDING)
            return;
        await this.statusHistory.transition({
            orderId: order.id,
            toStatus: client_1.OrderStatus.PAYMENT_FAILED,
            actorType: client_1.OrderActorType.SYSTEM,
            note: 'Checkout expired — payment not completed',
            extraOrderData: { paymentStatus: client_1.PaymentStatus.FAILED },
            skipIfAlreadyStatus: true,
        });
        await this.prisma.payment.updateMany({
            where: { orderId: order.id, status: client_1.PaymentStatus.PENDING },
            data: { status: client_1.PaymentStatus.FAILED, failureReason: 'Checkout expired' },
        });
        void this.orderCache.invalidateAll(order.id);
    }
    async cancelStalePaymentPendingOrders() {
        const stale = await this.prisma.order.findMany({
            where: {
                status: client_1.OrderStatus.PAYMENT_PENDING,
                checkout: { status: client_1.CheckoutStatus.EXPIRED },
            },
            select: { id: true },
            take: 50,
        });
        for (const order of stale) {
            try {
                await this.cancelExpiredPendingOrder(order.id);
            }
            catch (err) {
                this.logger.error({ orderId: order.id, error: err.message }, 'Failed to cancel stale pending order');
            }
        }
    }
};
exports.ReservationService = ReservationService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReservationService.prototype, "releaseExpiredReservations", null);
exports.ReservationService = ReservationService = ReservationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        domain_events_service_1.DomainEventsService,
        inventory_service_1.InventoryService,
        order_status_history_service_1.OrderStatusHistoryService,
        order_cache_service_1.OrderCacheService,
        distributed_lock_service_1.DistributedLockService])
], ReservationService);
//# sourceMappingURL=reservation.service.js.map