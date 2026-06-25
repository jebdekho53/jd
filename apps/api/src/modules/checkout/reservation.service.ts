import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DomainEventType, Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { InventoryService } from '../inventory/inventory.service';

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
    const now = new Date();

    const expiredCheckouts = await this.prisma.checkout.findMany({
      where: {
        status: { in: ['INITIATED', 'RESERVED'] },
        reservations: {
          some: { status: ReservationStatus.ACTIVE, expiresAt: { lte: now } },
        },
      },
      select: { id: true, buyerProfileId: true },
    });

    if (expiredCheckouts.length === 0) return;

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
      } catch (err) {
        this.logger.error(
          { checkoutId: checkout.id, error: (err as Error).message },
          'Failed to release expired reservation',
        );
      }
    }
  }
}
