import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderActorType, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { OrderCacheService } from '../order/order-cache.service';
import { DistributedLockService } from '../../redis/distributed-lock.service';
import { ReservationService } from './reservation.service';

/** Unpaid (non-COD) orders older than this are auto-expired. */
export const ORDER_EXPIRY_AFTER_MS = 3 * 60 * 60 * 1000;

/**
 * Payment methods that require up-front payment. COD variants are deliberately
 * excluded — they are paid on delivery and must never be auto-expired.
 */
export const PREPAID_METHODS: PaymentMethod[] = [
  PaymentMethod.RAZORPAY,
  PaymentMethod.WALLET,
  PaymentMethod.WALLET_RAZORPAY,
];

/**
 * Soft-expires orders that never completed payment. An order that sits in
 * PAYMENT_PENDING for more than 3 hours (and is not COD) is marked EXPIRED, its
 * reserved inventory is released, and its dangling payment intent is failed.
 * The order record is kept for audit — never hard-deleted.
 */
@Injectable()
export class OrderExpiryService {
  private readonly logger = new Logger(OrderExpiryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reservations: ReservationService,
    private readonly statusHistory: OrderStatusHistoryService,
    private readonly orderCache: OrderCacheService,
    private readonly lock: DistributedLockService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireUnpaidOrders(): Promise<void> {
    await this.lock.runExclusive('cron:order-expiry', 60, async () => {
      await this.expireUnpaidOrdersInner();
    });
  }

  /** Returns the number of orders expired in this run. */
  async expireUnpaidOrdersInner(): Promise<number> {
    const cutoff = new Date(Date.now() - ORDER_EXPIRY_AFTER_MS);

    const candidates = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PAYMENT_PENDING,
        paymentMethod: { in: PREPAID_METHODS },
        paymentStatus: { not: PaymentStatus.PAID },
        createdAt: { lt: cutoff },
        // Never touch an order that already has a dispatched shipment.
        providerShipment: { is: null },
      },
      select: { id: true },
      take: 200,
    });

    let expired = 0;
    for (const { id } of candidates) {
      try {
        if (await this.expireOne(id)) expired += 1;
      } catch (err) {
        this.logger.error(
          { orderId: id, error: (err as Error).message },
          'Failed to expire unpaid order',
        );
      }
    }

    if (expired > 0) {
      this.logger.log({ expired }, 'Auto-expired unpaid orders');
    }
    return expired;
  }

  /**
   * Expire a single order after re-validating every precondition against fresh
   * state. Returns true only if the order was actually expired.
   */
  async expireOne(orderId: string): Promise<boolean> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        createdAt: true,
        payment: { select: { status: true } },
        providerShipment: { select: { id: true } },
      },
    });
    if (!order) return false;

    // --- Defensive guards (re-checked against fresh state) ---
    // 1. Only pure pre-payment orders. Anything a merchant accepted/packed or
    //    that advanced past PAYMENT_PENDING is out of scope.
    if (order.status !== OrderStatus.PAYMENT_PENDING) return false;
    // 2. COD orders pay on delivery — never expire them.
    if (!PREPAID_METHODS.includes(order.paymentMethod)) return false;
    // 3. Younger than the threshold — leave for a later cycle.
    if (order.createdAt.getTime() > Date.now() - ORDER_EXPIRY_AFTER_MS) return false;
    // 4. A shipment implies the order is live — never touch it.
    if (order.providerShipment) return false;
    // 5. Race guard: a payment success may have landed without the order status
    //    syncing yet. If so, skip and let normal flow (or a later cycle) handle it.
    if (
      order.paymentStatus === PaymentStatus.PAID ||
      order.payment?.status === PaymentStatus.PAID
    ) {
      this.logger.warn(
        { orderId, orderNumber: order.orderNumber },
        'Skipping expiry — payment success detected for order still in PAYMENT_PENDING',
      );
      return false;
    }

    // Release reserved inventory so stock is not locked forever.
    await this.reservations.releaseOrderReservations(orderId);

    // Soft-cancel: mark EXPIRED (kept for audit, not deleted).
    await this.statusHistory.transition({
      orderId,
      toStatus: OrderStatus.EXPIRED,
      actorType: OrderActorType.SYSTEM,
      note: 'Auto-expired: payment not completed within 3 hours',
      extraOrderData: {
        paymentStatus: PaymentStatus.FAILED,
        cancelledAt: new Date(),
        cancelReason: 'Payment not completed within 3 hours',
      },
      skipIfAlreadyStatus: true,
    });

    // Fail the dangling payment intent so it can't be confused with an active
    // order. No refund is attempted — nothing was ever paid.
    await this.prisma.payment.updateMany({
      where: { orderId, status: PaymentStatus.PENDING },
      data: { status: PaymentStatus.FAILED, failureReason: 'Order expired — payment not completed' },
    });

    void this.orderCache.invalidateAll(orderId);
    this.logger.log(
      { orderId, orderNumber: order.orderNumber, reason: 'unpaid_over_3h' },
      'Order auto-expired',
    );
    return true;
  }
}
