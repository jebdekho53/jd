import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  DomainEventType,
  FoodKitchenStatus,
  OrderActorType,
  OrderStatus,
  OrderVertical,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RazorpayService } from '../payment/razorpay.service';
import { FoodCheckoutService } from './food-checkout.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { BuyerPushNotificationService } from '../push/buyer-push-notification.service';
import { OrderCacheService } from '../order/order-cache.service';
import { VerifyFoodPaymentDto } from './dto/verify-food-payment.dto';

const FOOD_CHECKOUT_PENDING = 'PENDING';
const FOOD_CHECKOUT_COMPLETED = 'COMPLETED';
const FOOD_CHECKOUT_EXPIRED = 'EXPIRED';

@Injectable()
export class FoodPaymentService {
  private readonly logger = new Logger(FoodPaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
    private readonly foodCheckout: FoodCheckoutService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
    private readonly statusHistory: OrderStatusHistoryService,
    private readonly emailNotifications: EmailNotificationService,
    private readonly buyerPush: BuyerPushNotificationService,
    private readonly orderCache: OrderCacheService,
  ) {}

  async createRazorpayOrder(userId: string, foodCheckoutId: string, ipAddress?: string) {
    if (!this.razorpay.isConfigured()) {
      throw new BadRequestException('Online payments are not configured');
    }

    const checkout = await this.requireOwnedFoodCheckout(userId, foodCheckoutId);

    if (checkout.status === FOOD_CHECKOUT_COMPLETED && checkout.orderId) {
      const order = await this.prisma.order.findUnique({ where: { id: checkout.orderId } });
      if (!order) throw new NotFoundException('Order not found');
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
      throw new BadRequestException(`Cannot pay for checkout in status: ${checkout.status}`);
    }
    if (checkout.expiresAt < new Date()) {
      await this.prisma.foodCheckout.update({
        where: { id: checkout.id },
        data: { status: FOOD_CHECKOUT_EXPIRED },
      });
      throw new BadRequestException('Food checkout has expired');
    }
    if (checkout.paymentMethod !== PaymentMethod.RAZORPAY) {
      throw new BadRequestException('This checkout is not an online payment checkout');
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

    const rzpOrder = await this.razorpay.createOrder(
      Number(checkout.totalAmount),
      `FOOD-${checkout.id.slice(-8).toUpperCase()}`,
    );

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

  async verifyPayment(userId: string, dto: VerifyFoodPaymentDto, ipAddress?: string) {
    const signatureValid = this.razorpay.verifyPaymentSignature(
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
    );
    if (!signatureValid) {
      throw new UnauthorizedException('Payment signature verification failed');
    }

    const checkout = await this.requireOwnedFoodCheckout(userId, dto.foodCheckoutId);
    if (checkout.razorpayOrderId && checkout.razorpayOrderId !== dto.razorpayOrderId) {
      throw new UnauthorizedException('Payment order ID mismatch');
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

  async syncPayment(userId: string, foodCheckoutId: string, ipAddress?: string) {
    const checkout = await this.requireOwnedFoodCheckout(userId, foodCheckoutId);
    if (checkout.status === FOOD_CHECKOUT_COMPLETED && checkout.orderId) {
      const order = await this.prisma.order.findUnique({ where: { id: checkout.orderId } });
      return {
        success: true,
        orderId: order!.id,
        orderNumber: order!.orderNumber,
        message: 'Payment already verified',
      };
    }
    if (!checkout.razorpayOrderId) {
      throw new BadRequestException('No Razorpay payment found for this checkout');
    }

    const remotePayments = await this.razorpay.fetchOrderPayments(checkout.razorpayOrderId);
    const captured = remotePayments.find((p) => p.status === 'captured');
    if (!captured) {
      throw new BadRequestException('Payment not captured on Razorpay yet');
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

  /** Webhook path — idempotent finalize when grocery Payment row does not exist yet. */
  async finalizeFromWebhook(razorpayOrderId: string, razorpayPaymentId: string): Promise<void> {
    const checkout = await this.prisma.foodCheckout.findFirst({
      where: { razorpayOrderId },
    });
    if (!checkout) return;
    if (checkout.status === FOOD_CHECKOUT_COMPLETED && checkout.orderId) return;

    const buyer = await this.prisma.buyerProfile.findUnique({
      where: { id: checkout.buyerProfileId },
      select: { userId: true },
    });
    if (!buyer) return;

    await this.finalizeFoodPayment({
      checkout,
      userId: buyer.userId,
      razorpayPaymentId,
      note: 'Food payment captured (webhook)',
      auditAction: 'FOOD_PAYMENT_WEBHOOK',
    });
  }

  private async finalizeFoodPayment(opts: {
    checkout: {
      id: string;
      buyerProfileId: string;
      storeId: string;
      status: string;
      orderId: string | null;
      cartSnapshot: Prisma.JsonValue;
      totalAmount: Prisma.Decimal;
      paymentMethod: PaymentMethod;
      razorpayOrderId: string | null;
    };
    userId: string;
    razorpayPaymentId: string;
    razorpaySignature?: string;
    ipAddress?: string;
    note: string;
    auditAction: string;
  }) {
    if (opts.checkout.status === FOOD_CHECKOUT_COMPLETED && opts.checkout.orderId) {
      const order = await this.prisma.order.findUnique({ where: { id: opts.checkout.orderId } });
      return {
        success: true,
        orderId: order!.id,
        orderNumber: order!.orderNumber,
        message: 'Payment already processed',
      };
    }

    if (!opts.checkout.cartSnapshot) {
      throw new BadRequestException('Food checkout is missing cart snapshot');
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
      toStatus: OrderStatus.PAID,
      actorType: OrderActorType.BUYER,
      actorId: opts.userId,
      note: opts.note,
      extraOrderData: { paymentStatus: PaymentStatus.PAID },
      skipIfAlreadyStatus: true,
    });

    await this.audit.log({
      actorId: opts.userId,
      action: opts.auditAction,
      resourceType: 'order',
      resourceId: orderResult.orderId,
      ipAddress: opts.ipAddress,
    });

    void this.domainEvents.emit(
      DomainEventType.PAYMENT_SUCCESS,
      'order',
      orderResult.orderId,
      { foodCheckoutId: opts.checkout.id, vertical: OrderVertical.FOOD },
    );
    void this.domainEvents.emit(
      DomainEventType.ORDER_CREATED,
      'order',
      orderResult.orderId,
      { vertical: OrderVertical.FOOD },
    );

    void this.emailNotifications.sendOrderConfirmation(orderResult.orderId).catch((err) => {
      this.logger.warn(`Food order confirmation email failed: ${(err as Error).message}`);
    });
    void this.buyerPush.notifyOrderPlaced(orderResult.orderId).catch(() => {});
    void this.orderCache.invalidateAll(orderResult.orderId);

    return {
      success: true,
      orderId: orderResult.orderId,
      orderNumber: orderResult.orderNumber,
    };
  }

  private async requireOwnedFoodCheckout(userId: string, foodCheckoutId: string) {
    const bp = await this.prisma.buyerProfile.findUnique({ where: { userId } });
    if (!bp) throw new NotFoundException('Buyer profile not found');

    const checkout = await this.prisma.foodCheckout.findFirst({
      where: { id: foodCheckoutId, buyerProfileId: bp.id },
    });
    if (!checkout) throw new NotFoundException('Food checkout not found');
    return checkout;
  }
}
