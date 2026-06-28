import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
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
import { RazorpayService } from './razorpay.service';
import { CreateRazorpayOrderDto } from './dto/create-razorpay-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

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
    const buyer = await this.getBuyerContact(userId);

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
      // Replay protection: already processed
      return { success: true, orderId: checkout.orderId, message: 'Payment already verified' };
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
      return { success: true, orderId: checkout.order.id, message: 'Payment already processed' };
    }

    // ── Confirm in a single transaction ──────────────────────────────────────
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          razorpayPaymentId: dto.razorpayPaymentId,
          razorpaySignature: dto.razorpaySignature,
        },
      });
      await tx.checkout.update({
        where: { id: checkout.id },
        data: { status: CheckoutStatus.COMPLETED },
      });
    });

    await this.statusHistory.transition({
      orderId: checkout.order!.id,
      toStatus: OrderStatus.PAID,
      actorType: OrderActorType.BUYER,
      actorId: userId,
      note: 'Payment verified',
      extraOrderData: { paymentStatus: PaymentStatus.PAID },
      skipIfAlreadyStatus: true,
    });

    // Stock remains reserved until delivery — no consumption on payment
    if (checkout.order?.id) {
      await this.reservationService.linkReservationsToOrder(checkout.id, checkout.order.id);
    }

    await Promise.all([
      this.audit.log({
        actorId: userId,
        action: 'PAYMENT_VERIFIED',
        resourceType: 'payment',
        resourceId: payment.id,
        ipAddress,
        metadata: {
          razorpayPaymentId: dto.razorpayPaymentId,
          orderId: checkout.order.id,
        } as Prisma.InputJsonValue,
      }),
      this.audit.log({
        actorId: userId,
        action: 'ORDER_CREATED',
        resourceType: 'order',
        resourceId: checkout.order.id,
        ipAddress,
        metadata: { orderNumber: checkout.order.orderNumber } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.PAYMENT_SUCCESS,
        'payment',
        payment.id,
        { orderId: checkout.order.id, checkoutId: checkout.id },
        { userId, ipAddress: ipAddress ?? null },
      ),
      this.domainEvents.emit(
        DomainEventType.ORDER_CREATED,
        'order',
        checkout.order.id,
        { orderNumber: checkout.order.orderNumber, storeId: checkout.storeId },
        { userId, ipAddress: ipAddress ?? null },
      ),
    ]);

    this.logger.log(
      { userId, orderId: checkout.order.id, razorpayPaymentId: dto.razorpayPaymentId },
      'Payment verified, order confirmed',
    );

    void this.emailNotifications.sendOrderConfirmation(checkout.order!.id).catch((err) => {
      this.logger.error({ err, orderId: checkout.order!.id }, 'Order confirmation email failed');
    });
    void this.buyerPush.notifyOrderPlaced(checkout.order!.id).catch(() => {});

    void this.orderFinancials.recordOnlinePaymentConfirmed(checkout.order.id).catch((err) => {
      this.logger.warn(`Ledger payment confirm failed: ${(err as Error).message}`);
    });
    void this.orderCache.invalidateAll(checkout.order.id);

    return { success: true, orderId: checkout.order.id, orderNumber: checkout.order.orderNumber };
  }

  // ── Razorpay webhook handler ───────────────────────────────────────────────

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    if (!this.razorpay.verifyWebhookSignature(rawBody, signature)) {
      this.logger.warn('Razorpay webhook: invalid signature');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    let event: { event: string; payload?: Record<string, unknown> };
    try {
      event = JSON.parse(rawBody.toString('utf8')) as typeof event;
    } catch {
      throw new BadRequestException('Invalid webhook payload');
    }

    this.logger.log({ eventType: event.event }, 'Razorpay webhook received');

    switch (event.event) {
      case 'payment.captured':
        await this.handlePaymentCaptured(event.payload);
        break;

      case 'payment.failed':
        await this.handlePaymentFailed(event.payload);
        break;

      default:
        this.logger.debug(`Unhandled webhook event: ${event.event}`);
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
      this.logger.warn({ razorpayOrderId }, 'Webhook: payment not found');
      return;
    }

    // Idempotent: already processed
    if (payment.status === PaymentStatus.PAID) return;

    const razorpayPaymentId = this.extractRazorpayPaymentId(payload);

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.PAID, razorpayPaymentId: razorpayPaymentId ?? undefined },
      });
      await tx.checkout.updateMany({
        where: { orderId: payment.order.id },
        data: { status: CheckoutStatus.COMPLETED },
      });
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
      select: { name: true, user: { select: { phone: true } } },
    });
    if (!buyerProfile) throw new NotFoundException('Buyer profile not found');
    return { name: buyerProfile.name, phone: buyerProfile.user.phone };
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
    buyer: { name: string; phone: string },
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
}
