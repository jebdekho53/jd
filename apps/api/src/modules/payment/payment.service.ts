import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import {
  CheckoutStatus,
  DomainEventType,
  OrderActorType,
  OrderStatus,
  PaymentStatus,
  Prisma,
  ReservationStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { ReservationService } from '../checkout/reservation.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { BuyerPushNotificationService } from '../push/buyer-push-notification.service';
import { OrderFinancialsService } from '../finance/order-financials.service';
import { OrderCacheService } from '../order/order-cache.service';
import { DeliveryDispatchService } from '../logistics/delivery-dispatch.service';
import { RazorpayService } from './razorpay.service';
import { CreateRazorpayOrderDto } from './dto/create-razorpay-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { normalizePayerPhone } from '../checkout/dto/payer-contact.dto';
import { FoodPaymentService } from '../food/food-payment.service';
import { WebhookProvider } from '@prisma/client';
import { WebhookDedupService } from '../../common/webhooks/webhook-dedup.service';
import { OrderRefundService } from './order-refund.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
    private readonly reservationService: ReservationService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
    private readonly statusHistory: OrderStatusHistoryService,
    private readonly emailNotifications: EmailNotificationService,
    private readonly buyerPush: BuyerPushNotificationService,
    private readonly orderFinancials: OrderFinancialsService,
    private readonly orderCache: OrderCacheService,
    private readonly deliveryDispatch: DeliveryDispatchService,
    @Inject(forwardRef(() => FoodPaymentService))
    private readonly foodPayment: FoodPaymentService,
    private readonly webhookDedup: WebhookDedupService,
    private readonly orderRefunds: OrderRefundService,
  ) {}

  // ── Create Razorpay order for a reserved checkout ─────────────────────────

  async createRazorpayOrder(
    userId: string,
    dto: CreateRazorpayOrderDto,
    ipAddress?: string,
  ) {
    if (!this.razorpay.isConfigured()) {
      throw new BadRequestException('Online payments are not configured. Please use COD or contact support.');
    }

    const checkout = await this.requireOwnedCheckout(userId, dto.checkoutId);
    const buyer = await this.resolvePayerContact(checkout, userId);

    if (checkout.status !== CheckoutStatus.RESERVED) {
      throw new BadRequestException(
        `Cannot create payment for checkout in status: ${checkout.status}`,
      );
    }

    if (checkout.expiresAt < new Date()) {
      throw new BadRequestException('Checkout has expired. Please start a new checkout.');
    }

    // Idempotent: if payment already created return existing
    const existingPayment = checkout.order?.payment;
    if (existingPayment?.razorpayOrderId) {
      return this.buildRazorpayOrderResponse(
        checkout,
        {
          id: existingPayment.razorpayOrderId,
          amount: Math.round(Number(existingPayment.amount) * 100),
          currency: 'INR',
        },
        buyer,
      );
    }

    if (!checkout.order) {
      throw new NotFoundException('Order not found for this checkout');
    }

    const chargeAmount =
      checkout.order.razorpayAmount != null
        ? Number(checkout.order.razorpayAmount)
        : Number(checkout.totalAmount);

    if (chargeAmount <= 0) {
      throw new BadRequestException('No Razorpay payment required for this order');
    }

    const rzpOrder = await this.razorpay.createOrder(
      chargeAmount,
      checkout.order.orderNumber,
    );

    // Persist razorpayOrderId on Payment record
    await this.prisma.payment.upsert({
      where: { orderId: checkout.order.id },
      create: {
        orderId: checkout.order.id,
        amount: chargeAmount,
        method: 'RAZORPAY',
        status: PaymentStatus.PENDING,
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
      metadata: { razorpayOrderId: rzpOrder.id } as Prisma.InputJsonValue,
    });

    this.logger.log({ userId, checkoutId: checkout.id, rzpOrderId: rzpOrder.id }, 'Razorpay order created');

    return this.buildRazorpayOrderResponse(checkout, rzpOrder, buyer);
  }

  // ── Verify Razorpay payment signature ─────────────────────────────────────

  async verifyPayment(
    userId: string,
    dto: VerifyPaymentDto,
    ipAddress?: string,
  ) {
    // Verify HMAC signature — reject instantly on failure
    const signatureValid = this.razorpay.verifyPaymentSignature(
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
    );

    if (!signatureValid) {
      this.logger.warn({ userId, razorpayOrderId: dto.razorpayOrderId }, 'Invalid Razorpay signature');
      throw new UnauthorizedException('Payment signature verification failed');
    }

    const checkout = await this.requireOwnedCheckout(userId, dto.checkoutId);

    if (checkout.status === CheckoutStatus.COMPLETED) {
      const order = checkout.order;
      if (!order) throw new NotFoundException('Order not found');
      return {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        message: 'Payment already verified',
      };
    }

    if (checkout.status !== CheckoutStatus.RESERVED) {
      throw new BadRequestException(`Checkout is in status ${checkout.status} — cannot verify payment`);
    }

    if (!checkout.order) throw new NotFoundException('Order not found');

    const payment = await this.prisma.payment.findUnique({
      where: { orderId: checkout.order.id },
    });
    if (!payment) throw new NotFoundException('Payment record not found');

    if (payment.razorpayOrderId && payment.razorpayOrderId !== dto.razorpayOrderId) {
      this.logger.warn(
        { userId, expected: payment.razorpayOrderId, received: dto.razorpayOrderId },
        'Razorpay order ID mismatch',
      );
      throw new UnauthorizedException('Payment order ID mismatch');
    }

    // Replay: payment already paid
    if (payment.status === PaymentStatus.PAID) {
      await this.prisma.checkout.updateMany({
        where: { id: checkout.id, status: { not: CheckoutStatus.COMPLETED } },
        data: { status: CheckoutStatus.COMPLETED },
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

  /** Reconcile payment from Razorpay when client verify fails but money was captured. */
  async syncCheckoutPayment(userId: string, checkoutId: string, ipAddress?: string) {
    const checkout = await this.requireOwnedCheckout(userId, checkoutId);

    if (checkout.status === CheckoutStatus.COMPLETED && checkout.order) {
      return {
        success: true,
        orderId: checkout.order.id,
        orderNumber: checkout.order.orderNumber,
        message: 'Payment already verified',
      };
    }

    if (checkout.status !== CheckoutStatus.RESERVED || !checkout.order) {
      throw new BadRequestException(`Checkout is in status ${checkout.status} — cannot sync payment`);
    }

    const payment = await this.prisma.payment.findUnique({
      where: { orderId: checkout.order.id },
    });
    if (!payment?.razorpayOrderId) {
      throw new BadRequestException('No Razorpay payment found for this checkout');
    }

    if (payment.status === PaymentStatus.PAID) {
      await this.prisma.checkout.updateMany({
        where: { id: checkout.id, status: { not: CheckoutStatus.COMPLETED } },
        data: { status: CheckoutStatus.COMPLETED },
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
      throw new BadRequestException('Payment not captured on Razorpay yet');
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

  // ── Razorpay webhook handler ───────────────────────────────────────────────

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    if (!this.razorpay.verifyWebhookSignature(rawBody, signature)) {
      this.logger.warn('Razorpay webhook: invalid signature');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    let event: { event: string; id?: string; payload?: Record<string, unknown> };
    try {
      event = JSON.parse(rawBody.toString('utf8')) as typeof event;
    } catch {
      throw new BadRequestException('Invalid webhook payload');
    }

    const claim = await this.webhookDedup.claimEvent(
      WebhookProvider.RAZORPAY,
      event.id,
      rawBody,
      signature,
    );
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Webhook processing failed';
      await this.webhookDedup.markFailed(claim.recordId, message);
      throw err;
    }
  }

  // ── Webhook event handlers ─────────────────────────────────────────────────

  private async handlePaymentCaptured(
    payload: Record<string, unknown> | undefined,
  ): Promise<void> {
    const razorpayOrderId = this.extractRazorpayOrderId(payload);
    if (!razorpayOrderId) return;

    const payment = await this.prisma.payment.findFirst({
      where: { razorpayOrderId },
      include: { order: { select: { id: true, orderNumber: true, buyerProfileId: true, status: true } } },
    });

    if (!payment) {
      const razorpayPaymentId = this.extractRazorpayPaymentId(payload);
      if (razorpayOrderId && razorpayPaymentId) {
        await this.foodPayment.finalizeFromWebhook(razorpayOrderId, razorpayPaymentId);
      } else {
        this.logger.warn({ razorpayOrderId }, 'Webhook: payment not found');
      }
      return;
    }

    // Idempotent: already processed
    if (payment.status === PaymentStatus.PAID) return;

    const razorpayPaymentId = this.extractRazorpayPaymentId(payload);

    const updated = await this.prisma.payment.updateMany({
      where: { id: payment.id, status: { not: PaymentStatus.PAID } },
      data: { status: PaymentStatus.PAID, razorpayPaymentId: razorpayPaymentId ?? undefined },
    });
    if (updated.count === 0) return;

    await this.prisma.checkout.updateMany({
      where: { orderId: payment.order.id },
      data: { status: CheckoutStatus.COMPLETED },
    });

    await this.statusHistory.transition({
      orderId: payment.order.id,
      toStatus: OrderStatus.PAID,
      actorType: OrderActorType.SYSTEM,
      note: 'Payment captured (webhook)',
      extraOrderData: { paymentStatus: PaymentStatus.PAID },
      skipIfAlreadyStatus: true,
    });

    // Find checkout for inventory
    const checkout = await this.prisma.checkout.findFirst({
      where: { orderId: payment.order.id },
    });
    if (checkout?.orderId) {
      await this.reservationService.linkReservationsToOrder(checkout.id, checkout.orderId);
    }

    await this.domainEvents.emit(
      DomainEventType.PAYMENT_SUCCESS,
      'payment',
      payment.id,
      { orderId: payment.order.id, razorpayOrderId, source: 'webhook' },
      { userId: payment.order.buyerProfileId, ipAddress: null },
    );

    void this.orderFinancials.recordOnlinePaymentConfirmed(payment.order.id).catch((err) => {
      this.logger.warn(`Ledger payment confirm failed: ${(err as Error).message}`);
    });
    void this.orderCache.invalidateAll(payment.order.id);
    void this.emailNotifications.sendOrderConfirmation(payment.order.id).catch((err) => {
      this.logger.error({ err, orderId: payment.order.id }, 'Order confirmation email failed (webhook)');
    });
    this.scheduleRiderDispatch(payment.order.id);
  }

  private async handlePaymentFailed(
    payload: Record<string, unknown> | undefined,
  ): Promise<void> {
    const razorpayOrderId = this.extractRazorpayOrderId(payload);
    if (!razorpayOrderId) return;

    const payment = await this.prisma.payment.findFirst({
      where: { razorpayOrderId },
      include: { order: { select: { id: true, buyerProfileId: true } } },
    });

    if (!payment || payment.status !== PaymentStatus.PENDING) return;

    const failureReason = this.extractFailureReason(payload);

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED, failureReason },
    });

    await this.statusHistory.transition({
      orderId: payment.order.id,
      toStatus: OrderStatus.PAYMENT_FAILED,
      actorType: OrderActorType.SYSTEM,
      note: failureReason ?? 'Payment failed (webhook)',
      extraOrderData: { paymentStatus: PaymentStatus.FAILED },
      skipIfAlreadyStatus: true,
    });

    const checkout = await this.prisma.checkout.findFirst({
      where: { orderId: payment.order.id },
    });
    if (checkout) {
      await this.reservationService.releaseReservations(checkout.id, 'RELEASED');
      await this.prisma.checkout.update({
        where: { id: checkout.id },
        data: { status: CheckoutStatus.EXPIRED },
      });
    }

    await this.domainEvents.emit(
      DomainEventType.PAYMENT_FAILED,
      'payment',
      payment.id,
      { orderId: payment.order.id, failureReason, source: 'webhook' },
      { userId: payment.order.buyerProfileId, ipAddress: null },
    );

    void this.orderCache.invalidateAll(payment.order.id);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async getBuyerContact(userId: string) {
    const buyerProfile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
      select: { name: true, user: { select: { phone: true, email: true } } },
    });
    if (!buyerProfile) throw new NotFoundException('Buyer profile not found');
    return {
      name: buyerProfile.name,
      phone: normalizePayerPhone(buyerProfile.user.phone),
      email: buyerProfile.user.email ?? '',
    };
  }

  private async resolvePayerContact(
    checkout: { cartSnapshot: Prisma.JsonValue },
    userId: string,
  ): Promise<{ name: string; phone: string; email: string }> {
    try {
      const snap =
        typeof checkout.cartSnapshot === 'string'
          ? (JSON.parse(checkout.cartSnapshot) as Record<string, unknown>)
          : (checkout.cartSnapshot as Record<string, unknown>);
      const raw = snap?.payerContact as { name?: string; email?: string; phone?: string } | undefined;
      if (raw?.name?.trim() && raw?.email?.trim() && raw?.phone?.trim()) {
        return {
          name: raw.name.trim(),
          email: raw.email.trim().toLowerCase(),
          phone: normalizePayerPhone(raw.phone),
        };
      }
    } catch {
      // fall through to profile contact
    }
    return this.getBuyerContact(userId);
  }

  private async finalizeOnlinePayment(opts: {
    userId: string;
    checkout: {
      id: string;
      storeId: string;
      order: { id: string; orderNumber: string } | null;
    };
    payment: { id: string };
    razorpayPaymentId: string;
    razorpaySignature?: string;
    ipAddress?: string;
    note: string;
    auditAction: 'PAYMENT_VERIFIED' | 'PAYMENT_SYNCED';
  }) {
    const order = opts.checkout.order;
    if (!order) throw new NotFoundException('Order not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: opts.payment.id },
        data: {
          status: PaymentStatus.PAID,
          razorpayPaymentId: opts.razorpayPaymentId,
          ...(opts.razorpaySignature ? { razorpaySignature: opts.razorpaySignature } : {}),
        },
      });
      await tx.checkout.update({
        where: { id: opts.checkout.id },
        data: { status: CheckoutStatus.COMPLETED },
      });
    });

    await this.statusHistory.transition({
      orderId: order.id,
      toStatus: OrderStatus.PAID,
      actorType: OrderActorType.BUYER,
      actorId: opts.userId,
      note: opts.note,
      extraOrderData: { paymentStatus: PaymentStatus.PAID },
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
        } as Prisma.InputJsonValue,
      }),
      this.audit.log({
        actorId: opts.userId,
        action: 'ORDER_CREATED',
        resourceType: 'order',
        resourceId: order.id,
        ipAddress: opts.ipAddress,
        metadata: { orderNumber: order.orderNumber } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.PAYMENT_SUCCESS,
        'payment',
        opts.payment.id,
        { orderId: order.id, checkoutId: opts.checkout.id },
        { userId: opts.userId, ipAddress: opts.ipAddress ?? null },
      ),
      this.domainEvents.emit(
        DomainEventType.ORDER_CREATED,
        'order',
        order.id,
        { orderNumber: order.orderNumber, storeId: opts.checkout.storeId },
        { userId: opts.userId, ipAddress: opts.ipAddress ?? null },
      ),
    ]);

    this.logger.log(
      { userId: opts.userId, orderId: order.id, razorpayPaymentId: opts.razorpayPaymentId },
      opts.note,
    );

    void this.emailNotifications.sendOrderConfirmation(order.id).catch((err) => {
      this.logger.error({ err, orderId: order.id }, 'Order confirmation email failed');
    });
    void this.buyerPush.notifyOrderPlaced(order.id).catch(() => {});

    void this.orderFinancials.recordOnlinePaymentConfirmed(order.id).catch((err) => {
      this.logger.warn(`Ledger payment confirm failed: ${(err as Error).message}`);
    });
    void this.orderCache.invalidateAll(order.id);
    this.scheduleRiderDispatch(order.id);
  }

  private buildRazorpayOrderResponse(
    checkout: {
      id: string;
      order: {
        id: string;
        orderNumber: string;
      } | null;
    },
    rzpOrder: { id: string; amount: number; currency: string },
    buyer: { name: string; phone: string; email: string },
  ) {
    if (!checkout.order) throw new NotFoundException('Order not found for this checkout');

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

  private async requireOwnedCheckout(userId: string, checkoutId: string) {
    const bp = await this.prisma.buyerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!bp) throw new NotFoundException('Buyer profile not found');

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

    if (!checkout) throw new NotFoundException(`Checkout not found: ${checkoutId}`);
    return checkout;
  }

  private extractRazorpayOrderId(
    payload: Record<string, unknown> | undefined,
  ): string | null {
    try {
      const item = (payload as { payment?: { entity?: { order_id?: string } } })
        ?.payment?.entity?.order_id;
      return typeof item === 'string' ? item : null;
    } catch {
      return null;
    }
  }

  private extractRazorpayPaymentId(
    payload: Record<string, unknown> | undefined,
  ): string | null {
    try {
      const item = (payload as { payment?: { entity?: { id?: string } } })
        ?.payment?.entity?.id;
      return typeof item === 'string' ? item : null;
    } catch {
      return null;
    }
  }

  private extractFailureReason(
    payload: Record<string, unknown> | undefined,
  ): string | null {
    try {
      const desc = (
        payload as {
          payment?: { entity?: { error_description?: string } };
        }
      )?.payment?.entity?.error_description;
      return typeof desc === 'string' ? desc : null;
    } catch {
      return null;
    }
  }

  private scheduleRiderDispatch(orderId: string): void {
    void this.deliveryDispatch.dispatchAfterOrderPlaced(orderId).catch((err) => {
      this.logger.error({ orderId, err }, 'Rider dispatch failed after payment');
    });
  }
}
