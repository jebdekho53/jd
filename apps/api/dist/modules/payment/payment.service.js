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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PaymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const reservation_service_1 = require("../checkout/reservation.service");
const order_status_history_service_1 = require("../order/order-status-history.service");
const email_notification_service_1 = require("../email/email-notification.service");
const buyer_push_notification_service_1 = require("../push/buyer-push-notification.service");
const order_financials_service_1 = require("../finance/order-financials.service");
const order_cache_service_1 = require("../order/order-cache.service");
const delivery_dispatch_service_1 = require("../logistics/delivery-dispatch.service");
const razorpay_service_1 = require("./razorpay.service");
const payer_contact_dto_1 = require("../checkout/dto/payer-contact.dto");
const food_payment_service_1 = require("../food/food-payment.service");
const client_2 = require("@prisma/client");
const webhook_dedup_service_1 = require("../../common/webhooks/webhook-dedup.service");
const order_refund_service_1 = require("./order-refund.service");
let PaymentService = PaymentService_1 = class PaymentService {
    constructor(prisma, razorpay, reservationService, audit, domainEvents, statusHistory, emailNotifications, buyerPush, orderFinancials, orderCache, deliveryDispatch, foodPayment, webhookDedup, orderRefunds) {
        this.prisma = prisma;
        this.razorpay = razorpay;
        this.reservationService = reservationService;
        this.audit = audit;
        this.domainEvents = domainEvents;
        this.statusHistory = statusHistory;
        this.emailNotifications = emailNotifications;
        this.buyerPush = buyerPush;
        this.orderFinancials = orderFinancials;
        this.orderCache = orderCache;
        this.deliveryDispatch = deliveryDispatch;
        this.foodPayment = foodPayment;
        this.webhookDedup = webhookDedup;
        this.orderRefunds = orderRefunds;
        this.logger = new common_1.Logger(PaymentService_1.name);
    }
    async createRazorpayOrder(userId, dto, ipAddress) {
        if (!this.razorpay.isConfigured()) {
            throw new common_1.BadRequestException('Online payments are not configured. Please use COD or contact support.');
        }
        const checkout = await this.requireOwnedCheckout(userId, dto.checkoutId);
        const buyer = await this.resolvePayerContact(checkout, userId);
        if (checkout.status !== client_1.CheckoutStatus.RESERVED) {
            throw new common_1.BadRequestException(`Cannot create payment for checkout in status: ${checkout.status}`);
        }
        if (checkout.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Checkout has expired. Please start a new checkout.');
        }
        const existingPayment = checkout.order?.payment;
        if (existingPayment?.razorpayOrderId) {
            return this.buildRazorpayOrderResponse(checkout, {
                id: existingPayment.razorpayOrderId,
                amount: Math.round(Number(existingPayment.amount) * 100),
                currency: 'INR',
            }, buyer);
        }
        if (!checkout.order) {
            throw new common_1.NotFoundException('Order not found for this checkout');
        }
        const chargeAmount = checkout.order.razorpayAmount != null
            ? Number(checkout.order.razorpayAmount)
            : Number(checkout.totalAmount);
        if (chargeAmount <= 0) {
            throw new common_1.BadRequestException('No Razorpay payment required for this order');
        }
        const rzpOrder = await this.razorpay.createOrder(chargeAmount, checkout.order.orderNumber);
        await this.prisma.payment.upsert({
            where: { orderId: checkout.order.id },
            create: {
                orderId: checkout.order.id,
                amount: chargeAmount,
                method: 'RAZORPAY',
                status: client_1.PaymentStatus.PENDING,
                razorpayOrderId: rzpOrder.id,
            },
            update: { razorpayOrderId: rzpOrder.id },
        });
        await this.audit.log({
            actorId: userId,
            action: 'PAYMENT_CREATED',
            resourceType: 'checkout',
            resourceId: checkout.id,
            ipAddress,
            metadata: { razorpayOrderId: rzpOrder.id },
        });
        this.logger.log({ userId, checkoutId: checkout.id, rzpOrderId: rzpOrder.id }, 'Razorpay order created');
        return this.buildRazorpayOrderResponse(checkout, rzpOrder, buyer);
    }
    async verifyPayment(userId, dto, ipAddress) {
        const signatureValid = this.razorpay.verifyPaymentSignature(dto.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature);
        if (!signatureValid) {
            this.logger.warn({ userId, razorpayOrderId: dto.razorpayOrderId }, 'Invalid Razorpay signature');
            throw new common_1.UnauthorizedException('Payment signature verification failed');
        }
        const checkout = await this.requireOwnedCheckout(userId, dto.checkoutId);
        if (checkout.status === client_1.CheckoutStatus.COMPLETED) {
            const order = checkout.order;
            if (!order)
                throw new common_1.NotFoundException('Order not found');
            return {
                success: true,
                orderId: order.id,
                orderNumber: order.orderNumber,
                message: 'Payment already verified',
            };
        }
        if (checkout.status !== client_1.CheckoutStatus.RESERVED) {
            throw new common_1.BadRequestException(`Checkout is in status ${checkout.status} — cannot verify payment`);
        }
        if (!checkout.order)
            throw new common_1.NotFoundException('Order not found');
        const payment = await this.prisma.payment.findUnique({
            where: { orderId: checkout.order.id },
        });
        if (!payment)
            throw new common_1.NotFoundException('Payment record not found');
        if (payment.razorpayOrderId && payment.razorpayOrderId !== dto.razorpayOrderId) {
            this.logger.warn({ userId, expected: payment.razorpayOrderId, received: dto.razorpayOrderId }, 'Razorpay order ID mismatch');
            throw new common_1.UnauthorizedException('Payment order ID mismatch');
        }
        if (payment.status === client_1.PaymentStatus.PAID) {
            await this.prisma.checkout.updateMany({
                where: { id: checkout.id, status: { not: client_1.CheckoutStatus.COMPLETED } },
                data: { status: client_1.CheckoutStatus.COMPLETED },
            });
            return {
                success: true,
                orderId: checkout.order.id,
                orderNumber: checkout.order.orderNumber,
                message: 'Payment already processed',
            };
        }
        await this.finalizeOnlinePayment({
            userId,
            checkout,
            payment,
            razorpayPaymentId: dto.razorpayPaymentId,
            razorpaySignature: dto.razorpaySignature,
            ipAddress,
            note: 'Payment verified',
            auditAction: 'PAYMENT_VERIFIED',
        });
        return {
            success: true,
            orderId: checkout.order.id,
            orderNumber: checkout.order.orderNumber,
        };
    }
    async syncCheckoutPayment(userId, checkoutId, ipAddress) {
        const checkout = await this.requireOwnedCheckout(userId, checkoutId);
        if (checkout.status === client_1.CheckoutStatus.COMPLETED && checkout.order) {
            return {
                success: true,
                orderId: checkout.order.id,
                orderNumber: checkout.order.orderNumber,
                message: 'Payment already verified',
            };
        }
        if (checkout.status !== client_1.CheckoutStatus.RESERVED || !checkout.order) {
            throw new common_1.BadRequestException(`Checkout is in status ${checkout.status} — cannot sync payment`);
        }
        const payment = await this.prisma.payment.findUnique({
            where: { orderId: checkout.order.id },
        });
        if (!payment?.razorpayOrderId) {
            throw new common_1.BadRequestException('No Razorpay payment found for this checkout');
        }
        if (payment.status === client_1.PaymentStatus.PAID) {
            await this.prisma.checkout.updateMany({
                where: { id: checkout.id, status: { not: client_1.CheckoutStatus.COMPLETED } },
                data: { status: client_1.CheckoutStatus.COMPLETED },
            });
            return {
                success: true,
                orderId: checkout.order.id,
                orderNumber: checkout.order.orderNumber,
                message: 'Payment already processed',
            };
        }
        const remotePayments = await this.razorpay.fetchOrderPayments(payment.razorpayOrderId);
        const captured = remotePayments.find((p) => p.status === 'captured');
        if (!captured) {
            throw new common_1.BadRequestException('Payment not captured on Razorpay yet');
        }
        await this.finalizeOnlinePayment({
            userId,
            checkout,
            payment,
            razorpayPaymentId: captured.id,
            ipAddress,
            note: 'Payment synced from Razorpay',
            auditAction: 'PAYMENT_SYNCED',
        });
        return {
            success: true,
            orderId: checkout.order.id,
            orderNumber: checkout.order.orderNumber,
            message: 'Payment synced successfully',
        };
    }
    async handleWebhook(rawBody, signature) {
        if (!this.razorpay.verifyWebhookSignature(rawBody, signature)) {
            this.logger.warn('Razorpay webhook: invalid signature');
            throw new common_1.UnauthorizedException('Invalid webhook signature');
        }
        let event;
        try {
            event = JSON.parse(rawBody.toString('utf8'));
        }
        catch {
            throw new common_1.BadRequestException('Invalid webhook payload');
        }
        const claim = await this.webhookDedup.claimEvent(client_2.WebhookProvider.RAZORPAY, event.id, rawBody, signature);
        if (claim.action === 'duplicate') {
            this.logger.debug({ eventId: event.id }, 'Duplicate Razorpay webhook ignored');
            return;
        }
        this.logger.log({ eventType: event.event, eventId: event.id }, 'Razorpay webhook received');
        try {
            switch (event.event) {
                case 'payment.captured':
                    await this.handlePaymentCaptured(event.payload);
                    break;
                case 'payment.failed':
                    await this.handlePaymentFailed(event.payload);
                    break;
                case 'refund.processed':
                case 'refund.created':
                    await this.orderRefunds.reconcileRazorpayRefund(event.payload);
                    break;
                default:
                    this.logger.debug(`Unhandled webhook event: ${event.event}`);
            }
            await this.webhookDedup.markProcessed(claim.recordId);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Webhook processing failed';
            await this.webhookDedup.markFailed(claim.recordId, message);
            throw err;
        }
    }
    async handlePaymentCaptured(payload) {
        const razorpayOrderId = this.extractRazorpayOrderId(payload);
        if (!razorpayOrderId)
            return;
        const payment = await this.prisma.payment.findFirst({
            where: { razorpayOrderId },
            include: { order: { select: { id: true, orderNumber: true, buyerProfileId: true, status: true } } },
        });
        if (!payment) {
            const razorpayPaymentId = this.extractRazorpayPaymentId(payload);
            if (razorpayOrderId && razorpayPaymentId) {
                await this.foodPayment.finalizeFromWebhook(razorpayOrderId, razorpayPaymentId);
            }
            else {
                this.logger.warn({ razorpayOrderId }, 'Webhook: payment not found');
            }
            return;
        }
        if (payment.status === client_1.PaymentStatus.PAID)
            return;
        const razorpayPaymentId = this.extractRazorpayPaymentId(payload);
        const updated = await this.prisma.payment.updateMany({
            where: { id: payment.id, status: { not: client_1.PaymentStatus.PAID } },
            data: { status: client_1.PaymentStatus.PAID, razorpayPaymentId: razorpayPaymentId ?? undefined },
        });
        if (updated.count === 0)
            return;
        await this.prisma.checkout.updateMany({
            where: { orderId: payment.order.id },
            data: { status: client_1.CheckoutStatus.COMPLETED },
        });
        await this.statusHistory.transition({
            orderId: payment.order.id,
            toStatus: client_1.OrderStatus.PAID,
            actorType: client_1.OrderActorType.SYSTEM,
            note: 'Payment captured (webhook)',
            extraOrderData: { paymentStatus: client_1.PaymentStatus.PAID },
            skipIfAlreadyStatus: true,
        });
        const checkout = await this.prisma.checkout.findFirst({
            where: { orderId: payment.order.id },
        });
        if (checkout?.orderId) {
            await this.reservationService.linkReservationsToOrder(checkout.id, checkout.orderId);
        }
        await this.domainEvents.emit(client_1.DomainEventType.PAYMENT_SUCCESS, 'payment', payment.id, { orderId: payment.order.id, razorpayOrderId, source: 'webhook' }, { userId: payment.order.buyerProfileId, ipAddress: null });
        void this.orderFinancials.recordOnlinePaymentConfirmed(payment.order.id).catch((err) => {
            this.logger.warn(`Ledger payment confirm failed: ${err.message}`);
        });
        void this.orderCache.invalidateAll(payment.order.id);
        void this.emailNotifications.sendOrderConfirmation(payment.order.id).catch((err) => {
            this.logger.error({ err, orderId: payment.order.id }, 'Order confirmation email failed (webhook)');
        });
        void this.emailNotifications.sendBuyerPaymentSuccess(payment.order.id).catch((err) => {
            this.logger.error({ err, orderId: payment.order.id }, 'Payment success email failed (webhook)');
        });
        this.scheduleRiderDispatch(payment.order.id);
    }
    async handlePaymentFailed(payload) {
        const razorpayOrderId = this.extractRazorpayOrderId(payload);
        if (!razorpayOrderId)
            return;
        const payment = await this.prisma.payment.findFirst({
            where: { razorpayOrderId },
            include: { order: { select: { id: true, buyerProfileId: true } } },
        });
        if (!payment || payment.status !== client_1.PaymentStatus.PENDING)
            return;
        const failureReason = this.extractFailureReason(payload);
        await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: client_1.PaymentStatus.FAILED, failureReason },
        });
        await this.statusHistory.transition({
            orderId: payment.order.id,
            toStatus: client_1.OrderStatus.PAYMENT_FAILED,
            actorType: client_1.OrderActorType.SYSTEM,
            note: failureReason ?? 'Payment failed (webhook)',
            extraOrderData: { paymentStatus: client_1.PaymentStatus.FAILED },
            skipIfAlreadyStatus: true,
        });
        const checkout = await this.prisma.checkout.findFirst({
            where: { orderId: payment.order.id },
        });
        if (checkout) {
            await this.reservationService.releaseReservations(checkout.id, 'RELEASED');
            await this.prisma.checkout.update({
                where: { id: checkout.id },
                data: { status: client_1.CheckoutStatus.EXPIRED },
            });
        }
        await this.domainEvents.emit(client_1.DomainEventType.PAYMENT_FAILED, 'payment', payment.id, { orderId: payment.order.id, failureReason, source: 'webhook' }, { userId: payment.order.buyerProfileId, ipAddress: null });
        void this.orderCache.invalidateAll(payment.order.id);
        void this.emailNotifications.sendBuyerPaymentFailed(payment.order.id).catch((err) => {
            this.logger.error({ err, orderId: payment.order.id }, 'Payment failed email failed (webhook)');
        });
    }
    async getBuyerContact(userId) {
        const buyerProfile = await this.prisma.buyerProfile.findUnique({
            where: { userId },
            select: { name: true, user: { select: { phone: true, email: true } } },
        });
        if (!buyerProfile)
            throw new common_1.NotFoundException('Buyer profile not found');
        return {
            name: buyerProfile.name,
            phone: (0, payer_contact_dto_1.normalizePayerPhone)(buyerProfile.user.phone),
            email: buyerProfile.user.email ?? '',
        };
    }
    async resolvePayerContact(checkout, userId) {
        try {
            const snap = typeof checkout.cartSnapshot === 'string'
                ? JSON.parse(checkout.cartSnapshot)
                : checkout.cartSnapshot;
            const raw = snap?.payerContact;
            if (raw?.name?.trim() && raw?.email?.trim() && raw?.phone?.trim()) {
                return {
                    name: raw.name.trim(),
                    email: raw.email.trim().toLowerCase(),
                    phone: (0, payer_contact_dto_1.normalizePayerPhone)(raw.phone),
                };
            }
        }
        catch {
        }
        return this.getBuyerContact(userId);
    }
    async finalizeOnlinePayment(opts) {
        const order = opts.checkout.order;
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        await this.prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: { id: opts.payment.id },
                data: {
                    status: client_1.PaymentStatus.PAID,
                    razorpayPaymentId: opts.razorpayPaymentId,
                    ...(opts.razorpaySignature ? { razorpaySignature: opts.razorpaySignature } : {}),
                },
            });
            await tx.checkout.update({
                where: { id: opts.checkout.id },
                data: { status: client_1.CheckoutStatus.COMPLETED },
            });
        });
        await this.statusHistory.transition({
            orderId: order.id,
            toStatus: client_1.OrderStatus.PAID,
            actorType: client_1.OrderActorType.BUYER,
            actorId: opts.userId,
            note: opts.note,
            extraOrderData: { paymentStatus: client_1.PaymentStatus.PAID },
            skipIfAlreadyStatus: true,
        });
        await this.reservationService.linkReservationsToOrder(opts.checkout.id, order.id);
        await Promise.all([
            this.audit.log({
                actorId: opts.userId,
                action: opts.auditAction,
                resourceType: 'payment',
                resourceId: opts.payment.id,
                ipAddress: opts.ipAddress,
                metadata: {
                    razorpayPaymentId: opts.razorpayPaymentId,
                    orderId: order.id,
                },
            }),
            this.audit.log({
                actorId: opts.userId,
                action: 'ORDER_CREATED',
                resourceType: 'order',
                resourceId: order.id,
                ipAddress: opts.ipAddress,
                metadata: { orderNumber: order.orderNumber },
            }),
            this.domainEvents.emit(client_1.DomainEventType.PAYMENT_SUCCESS, 'payment', opts.payment.id, { orderId: order.id, checkoutId: opts.checkout.id }, { userId: opts.userId, ipAddress: opts.ipAddress ?? null }),
            this.domainEvents.emit(client_1.DomainEventType.ORDER_CREATED, 'order', order.id, { orderNumber: order.orderNumber, storeId: opts.checkout.storeId }, { userId: opts.userId, ipAddress: opts.ipAddress ?? null }),
        ]);
        this.logger.log({ userId: opts.userId, orderId: order.id, razorpayPaymentId: opts.razorpayPaymentId }, opts.note);
        void this.emailNotifications.sendOrderConfirmation(order.id).catch((err) => {
            this.logger.error({ err, orderId: order.id }, 'Order confirmation email failed');
        });
        void this.buyerPush.notifyOrderPlaced(order.id).catch(() => { });
        void this.orderFinancials.recordOnlinePaymentConfirmed(order.id).catch((err) => {
            this.logger.warn(`Ledger payment confirm failed: ${err.message}`);
        });
        void this.orderCache.invalidateAll(order.id);
        this.scheduleRiderDispatch(order.id);
    }
    buildRazorpayOrderResponse(checkout, rzpOrder, buyer) {
        if (!checkout.order)
            throw new common_1.NotFoundException('Order not found for this checkout');
        return {
            checkoutId: checkout.id,
            orderId: checkout.order.id,
            orderNumber: checkout.order.orderNumber,
            razorpayOrderId: rzpOrder.id,
            keyId: this.razorpay.keyId,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            buyerName: buyer.name,
            buyerPhone: buyer.phone,
            buyerEmail: buyer.email,
        };
    }
    async requireOwnedCheckout(userId, checkoutId) {
        const bp = await this.prisma.buyerProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!bp)
            throw new common_1.NotFoundException('Buyer profile not found');
        const checkout = await this.prisma.checkout.findFirst({
            where: { id: checkoutId, buyerProfileId: bp.id },
            include: {
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        status: true,
                        paymentStatus: true,
                        razorpayAmount: true,
                        payment: true,
                    },
                },
            },
        });
        if (!checkout)
            throw new common_1.NotFoundException(`Checkout not found: ${checkoutId}`);
        return checkout;
    }
    extractRazorpayOrderId(payload) {
        try {
            const item = payload
                ?.payment?.entity?.order_id;
            return typeof item === 'string' ? item : null;
        }
        catch {
            return null;
        }
    }
    extractRazorpayPaymentId(payload) {
        try {
            const item = payload
                ?.payment?.entity?.id;
            return typeof item === 'string' ? item : null;
        }
        catch {
            return null;
        }
    }
    extractFailureReason(payload) {
        try {
            const desc = payload?.payment?.entity?.error_description;
            return typeof desc === 'string' ? desc : null;
        }
        catch {
            return null;
        }
    }
    scheduleRiderDispatch(orderId) {
        void this.deliveryDispatch.dispatchAfterOrderPlaced(orderId).catch((err) => {
            this.logger.error({ orderId, err }, 'Rider dispatch failed after payment');
        });
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(11, (0, common_1.Inject)((0, common_1.forwardRef)(() => food_payment_service_1.FoodPaymentService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        razorpay_service_1.RazorpayService,
        reservation_service_1.ReservationService,
        audit_service_1.AuditService,
        domain_events_service_1.DomainEventsService,
        order_status_history_service_1.OrderStatusHistoryService,
        email_notification_service_1.EmailNotificationService,
        buyer_push_notification_service_1.BuyerPushNotificationService,
        order_financials_service_1.OrderFinancialsService,
        order_cache_service_1.OrderCacheService,
        delivery_dispatch_service_1.DeliveryDispatchService,
        food_payment_service_1.FoodPaymentService,
        webhook_dedup_service_1.WebhookDedupService,
        order_refund_service_1.OrderRefundService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map