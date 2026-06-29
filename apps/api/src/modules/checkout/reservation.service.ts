import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
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
import { InventoryService } from '../inventory/inventory.service';
import { OrderCacheService } from '../order/order-cache.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { DistributedLockService } from '../../redis/distributed-lock.service';

export const RESERVATION_TTL_MINUTES = 15;

export interface ReservationItem {
  variantId: string;
  productId: string;
  quantity: number;
}

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
    private readonly inventory: InventoryService,
    private readonly statusHistory: OrderStatusHistoryService,
    private readonly orderCache: OrderCacheService,
    private readonly lock: DistributedLockService,
  ) {}

  async reserveInventory(
    checkoutId: string,
    items: ReservationItem[],
    userId: string,
    ipAddress?: string,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000);

    await this.inventory.reserveForCheckout(checkoutId, items, expiresAt);

    void this.domainEvents.emit(
      DomainEventType.INVENTORY_RESERVED,
      'checkout',
      checkoutId,
      { items, expiresAt } as unknown as Prisma.InputJsonValue,
      { userId, ipAddress: ipAddress ?? null },
    );

    this.logger.log({ checkoutId, itemCount: items.length }, 'Inventory reserved');
  }

  async linkReservationsToOrder(checkoutId: string, orderId: string): Promise<void> {
    await this.inventory.linkReservationsToOrder(checkoutId, orderId);
  }

  async releaseReservations(
    checkoutId: string,
    reason: 'EXPIRED' | 'CANCELLED' | 'RELEASED',
    userId?: string,
  ): Promise<void> {
    await this.inventory.releaseByCheckout(checkoutId, reason);

    void this.domainEvents.emit(
      DomainEventType.INVENTORY_RELEASED,
      'checkout',
      checkoutId,
      { reason } as Prisma.InputJsonValue,
      { userId: userId ?? 'system', ipAddress: null },
    );

    this.logger.log({ checkoutId, reason }, 'Reservations released');
  }

  async releaseOrderReservations(orderId: string, userId?: string): Promise<void> {
    await this.inventory.releaseByOrder(orderId);

    void this.domainEvents.emit(
      DomainEventType.INVENTORY_RELEASED,
      'order',
      orderId,
      { reason: 'ORDER_CANCELLED' } as Prisma.InputJsonValue,
      { userId: userId ?? 'system', ipAddress: null },
    );
  }

  /** @deprecated Use fulfillOnDelivery — stock is consumed on delivery, not payment */
  async consumeReservations(checkoutId: string): Promise<void> {
    const checkout = await this.prisma.checkout.findUnique({
      where: { id: checkoutId },
      select: { orderId: true },
    });
    if (checkout?.orderId) {
      await this.linkReservationsToOrder(checkoutId, checkout.orderId);
    }
    this.logger.debug({ checkoutId }, 'consumeReservations noop — stock held until delivery');
  }

  async fulfillOnDelivery(orderId: string): Promise<void> {
    await this.inventory.fulfillOnDelivery(orderId);
    this.logger.log({ orderId }, 'Inventory fulfilled on delivery');
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async releaseExpiredReservations(): Promise<void> {
    await this.lock.runExclusive('cron:inventory-release', 50, async () => {
      await this.releaseExpiredReservationsInner();
    });
  }

  private async releaseExpiredReservationsInner(): Promise<void> {
    const now = new Date();

    const expiredCheckouts = await this.prisma.checkout.findMany({
      where: {
        status: { in: ['INITIATED', 'RESERVED'] },
        reservations: {
          some: { status: ReservationStatus.ACTIVE, expiresAt: { lte: now } },
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
          metadata: { buyerProfileId: checkout.buyerProfileId } as Prisma.InputJsonValue,
        });

        if (checkout.orderId) {
          await this.cancelExpiredPendingOrder(checkout.orderId);
        }
      } catch (err) {
        this.logger.error(
          { checkoutId: checkout.id, error: (err as Error).message },
          'Failed to release expired reservation',
        );
      }
    }

    await this.cancelStalePaymentPendingOrders();
  }

  private async cancelExpiredPendingOrder(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });
    if (!order || order.status !== OrderStatus.PAYMENT_PENDING) return;

    await this.statusHistory.transition({
      orderId: order.id,
      toStatus: OrderStatus.PAYMENT_FAILED,
      actorType: OrderActorType.SYSTEM,
      note: 'Checkout expired — payment not completed',
      extraOrderData: { paymentStatus: PaymentStatus.FAILED },
      skipIfAlreadyStatus: true,
    });

    await this.prisma.payment.updateMany({
      where: { orderId: order.id, status: PaymentStatus.PENDING },
      data: { status: PaymentStatus.FAILED, failureReason: 'Checkout expired' },
    });

    void this.orderCache.invalidateAll(order.id);
  }

  private async cancelStalePaymentPendingOrders(): Promise<void> {
    const stale = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PAYMENT_PENDING,
        checkout: { status: CheckoutStatus.EXPIRED },
      },
      select: { id: true },
      take: 50,
    });

    for (const order of stale) {
      try {
        await this.cancelExpiredPendingOrder(order.id);
      } catch (err) {
        this.logger.error(
          { orderId: order.id, error: (err as Error).message },
          'Failed to cancel stale pending order',
        );
      }
    }
  }
}
