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
var FoodPaymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoodPaymentService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const razorpay_service_1 = require("../payment/razorpay.service");
const food_checkout_service_1 = require("./food-checkout.service");
const audit_service_1 = require("../audit/audit.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const order_status_history_service_1 = require("../order/order-status-history.service");
const email_notification_service_1 = require("../email/email-notification.service");
const buyer_push_notification_service_1 = require("../push/buyer-push-notification.service");
const order_cache_service_1 = require("../order/order-cache.service");
const FOOD_CHECKOUT_PENDING = 'PENDING';
const FOOD_CHECKOUT_COMPLETED = 'COMPLETED';
const FOOD_CHECKOUT_EXPIRED = 'EXPIRED';
let FoodPaymentService = FoodPaymentService_1 = class FoodPaymentService {
    constructor(prisma, razorpay, foodCheckout, audit, domainEvents, statusHistory, emailNotifications, buyerPush, orderCache) {
        this.prisma = prisma;
        this.razorpay = razorpay;
        this.foodCheckout = foodCheckout;
        this.audit = audit;
        this.domainEvents = domainEvents;
        this.statusHistory = statusHistory;
        this.emailNotifications = emailNotifications;
        this.buyerPush = buyerPush;
        this.orderCache = orderCache;
        this.logger = new common_1.Logger(FoodPaymentService_1.name);
    }
    async createRazorpayOrder(userId, foodCheckoutId, ipAddress) {
        if (!this.razorpay.isConfigured()) {
            throw new common_1.BadRequestException('Online payments are not configured');
        }
        const checkout = await this.requireOwnedFoodCheckout(userId, foodCheckoutId);
        if (checkout.status === FOOD_CHECKOUT_COMPLETED && checkout.orderId) {
            const order = await this.prisma.order.findUnique({ where: { id: checkout.orderId } });
            if (!order)
                throw new common_1.NotFoundException('Order not found');
            return {
                foodCheckoutId: checkout.id,
                orderId: order.id,
                orderNumber: order.orderNumber,
                razorpayOrderId: checkout.razorpayOrderId,
                keyId: this.razorpay.keyId,
                amount: Math.round(Number(checkout.totalAmount) * 100),
                currency: 'INR',
            };
        }
        if (checkout.status !== FOOD_CHECKOUT_PENDING) {
            throw new common_1.BadRequestException(`Cannot pay for checkout in status: ${checkout.status}`);
        }
        if (checkout.expiresAt < new Date()) {
            await this.prisma.foodCheckout.update({
                where: { id: checkout.id },
                data: { status: FOOD_CHECKOUT_EXPIRED },
            });
            throw new common_1.BadRequestException('Food checkout has expired');
        }
        if (checkout.paymentMethod !== client_1.PaymentMethod.RAZORPAY) {
            throw new common_1.BadRequestException('This checkout is not an online payment checkout');
        }
        if (checkout.razorpayOrderId) {
            return {
                foodCheckoutId: checkout.id,
                razorpayOrderId: checkout.razorpayOrderId,
                keyId: this.razorpay.keyId,
                amount: Math.round(Number(checkout.totalAmount) * 100),
                currency: 'INR',
            };
        }
        const rzpOrder = await this.razorpay.createOrder(Number(checkout.totalAmount), `FOOD-${checkout.id.slice(-8).toUpperCase()}`);
        await this.prisma.foodCheckout.update({
            where: { id: checkout.id },
            data: { razorpayOrderId: rzpOrder.id },
        });
        await this.audit.log({
            actorId: userId,
            action: 'FOOD_RAZORPAY_ORDER_CREATED',
            resourceType: 'FoodCheckout',
            resourceId: checkout.id,
            ipAddress,
            metadata: { razorpayOrderId: rzpOrder.id },
        });
        return {
            foodCheckoutId: checkout.id,
            razorpayOrderId: rzpOrder.id,
            keyId: this.razorpay.keyId,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
        };
    }
    async verifyPayment(userId, dto, ipAddress) {
        const signatureValid = this.razorpay.verifyPaymentSignature(dto.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature);
        if (!signatureValid) {
            throw new common_1.UnauthorizedException('Payment signature verification failed');
        }
        const checkout = await this.requireOwnedFoodCheckout(userId, dto.foodCheckoutId);
        if (checkout.razorpayOrderId && checkout.razorpayOrderId !== dto.razorpayOrderId) {
            throw new common_1.UnauthorizedException('Payment order ID mismatch');
        }
        return this.finalizeFoodPayment({
            checkout,
            userId,
            razorpayPaymentId: dto.razorpayPaymentId,
            razorpaySignature: dto.razorpaySignature,
            ipAddress,
            note: 'Food payment verified',
            auditAction: 'FOOD_PAYMENT_VERIFIED',
        });
    }
    async syncPayment(userId, foodCheckoutId, ipAddress) {
        const checkout = await this.requireOwnedFoodCheckout(userId, foodCheckoutId);
        if (checkout.status === FOOD_CHECKOUT_COMPLETED && checkout.orderId) {
            const order = await this.prisma.order.findUnique({ where: { id: checkout.orderId } });
            return {
                success: true,
                orderId: order.id,
                orderNumber: order.orderNumber,
                message: 'Payment already verified',
            };
        }
        if (!checkout.razorpayOrderId) {
            throw new common_1.BadRequestException('No Razorpay payment found for this checkout');
        }
        const remotePayments = await this.razorpay.fetchOrderPayments(checkout.razorpayOrderId);
        const captured = remotePayments.find((p) => p.status === 'captured');
        if (!captured) {
            throw new common_1.BadRequestException('Payment not captured on Razorpay yet');
        }
        return this.finalizeFoodPayment({
            checkout,
            userId,
            razorpayPaymentId: captured.id,
            ipAddress,
            note: 'Food payment synced from Razorpay',
            auditAction: 'FOOD_PAYMENT_SYNCED',
        });
    }
    async finalizeFromWebhook(razorpayOrderId, razorpayPaymentId) {
        const checkout = await this.prisma.foodCheckout.findFirst({
            where: { razorpayOrderId },
        });
        if (!checkout)
            return;
        if (checkout.status === FOOD_CHECKOUT_COMPLETED && checkout.orderId)
            return;
        const buyer = await this.prisma.buyerProfile.findUnique({
            where: { id: checkout.buyerProfileId },
            select: { userId: true },
        });
        if (!buyer)
            return;
        await this.finalizeFoodPayment({
            checkout,
            userId: buyer.userId,
            razorpayPaymentId,
            note: 'Food payment captured (webhook)',
            auditAction: 'FOOD_PAYMENT_WEBHOOK',
        });
    }
    async finalizeFoodPayment(opts) {
        if (opts.checkout.status === FOOD_CHECKOUT_COMPLETED && opts.checkout.orderId) {
            const order = await this.prisma.order.findUnique({ where: { id: opts.checkout.orderId } });
            return {
                success: true,
                orderId: order.id,
                orderNumber: order.orderNumber,
                message: 'Payment already processed',
            };
        }
        if (!opts.checkout.cartSnapshot) {
            throw new common_1.BadRequestException('Food checkout is missing cart snapshot');
        }
        const orderResult = await this.foodCheckout.createPaidOrderFromCheckout({
            checkoutId: opts.checkout.id,
            buyerProfileId: opts.checkout.buyerProfileId,
            userId: opts.userId,
            razorpayPaymentId: opts.razorpayPaymentId,
            razorpayOrderId: opts.checkout.razorpayOrderId,
            razorpaySignature: opts.razorpaySignature,
        });
        await this.statusHistory.transition({
            orderId: orderResult.orderId,
            toStatus: client_1.OrderStatus.PAID,
            actorType: client_1.OrderActorType.BUYER,
            actorId: opts.userId,
            note: opts.note,
            extraOrderData: { paymentStatus: client_1.PaymentStatus.PAID },
            skipIfAlreadyStatus: true,
        });
        await this.audit.log({
            actorId: opts.userId,
            action: opts.auditAction,
            resourceType: 'order',
            resourceId: orderResult.orderId,
            ipAddress: opts.ipAddress,
        });
        void this.domainEvents.emit(client_1.DomainEventType.PAYMENT_SUCCESS, 'order', orderResult.orderId, { foodCheckoutId: opts.checkout.id, vertical: client_1.OrderVertical.FOOD });
        void this.domainEvents.emit(client_1.DomainEventType.ORDER_CREATED, 'order', orderResult.orderId, { vertical: client_1.OrderVertical.FOOD });
        void this.emailNotifications.sendOrderConfirmation(orderResult.orderId).catch((err) => {
            this.logger.warn(`Food order confirmation email failed: ${err.message}`);
        });
        void this.buyerPush.notifyOrderPlaced(orderResult.orderId).catch(() => { });
        void this.orderCache.invalidateAll(orderResult.orderId);
        return {
            success: true,
            orderId: orderResult.orderId,
            orderNumber: orderResult.orderNumber,
        };
    }
    async requireOwnedFoodCheckout(userId, foodCheckoutId) {
        const bp = await this.prisma.buyerProfile.findUnique({ where: { userId } });
        if (!bp)
            throw new common_1.NotFoundException('Buyer profile not found');
        const checkout = await this.prisma.foodCheckout.findFirst({
            where: { id: foodCheckoutId, buyerProfileId: bp.id },
        });
        if (!checkout)
            throw new common_1.NotFoundException('Food checkout not found');
        return checkout;
    }
};
exports.FoodPaymentService = FoodPaymentService;
exports.FoodPaymentService = FoodPaymentService = FoodPaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        razorpay_service_1.RazorpayService,
        food_checkout_service_1.FoodCheckoutService,
        audit_service_1.AuditService,
        domain_events_service_1.DomainEventsService,
        order_status_history_service_1.OrderStatusHistoryService,
        email_notification_service_1.EmailNotificationService,
        buyer_push_notification_service_1.BuyerPushNotificationService,
        order_cache_service_1.OrderCacheService])
], FoodPaymentService);
//# sourceMappingURL=food-payment.service.js.map