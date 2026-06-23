import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DomainEventType, Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';

export const RESERVATION_TTL_MINUTES = 15;

export interface ReservationItem {
  variantId: string;
  quantity: number;
}

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
  ) {}

  // ── Reserve inventory ──────────────────────────────────────────────────────
  //
  // Each item uses a raw UPDATE ... WHERE quantity - reserved >= qty so the
  // check-and-update is a single atomic statement. If the row is not updated
  // (0 affected rows) the variant is out of stock.

  async reserveInventory(
    checkoutId: string,
    items: ReservationItem[],
    userId: string,
    ipAddress?: string,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000);

    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        // Atomic check-and-increment using raw SQL to prevent race conditions.
        // This is the ONLY safe way to reserve without SELECT ... FOR UPDATE.
        const affected = await tx.$executeRaw`
          UPDATE inventory
          SET reserved = reserved + ${item.quantity},
              version  = version  + 1
          WHERE variant_id = ${item.variantId}
            AND (quantity - reserved) >= ${item.quantity}
        `;

        if (affected === 0) {
          // Could not reserve — check why (out of stock vs variant not found)
          const inv = await tx.inventory.findUnique({
            where: { variantId: item.variantId },
            select: { quantity: true, reserved: true },
          });

          if (!inv) {
            throw new BadRequestException(
              `Inventory record not found for variant: ${item.variantId}`,
            );
          }

          const available = inv.quantity - inv.reserved;
          throw new BadRequestException(
            `Insufficient stock: ${available} available, ${item.quantity} requested for variant ${item.variantId}`,
          );
        }

        // Record the reservation
        await tx.inventoryReservation.create({
          data: {
            checkoutId,
            variantId: item.variantId,
            quantity: item.quantity,
            status: ReservationStatus.ACTIVE,
            expiresAt,
          },
        });
      }
    });

    void this.domainEvents.emit(
      DomainEventType.INVENTORY_RESERVED,
      'checkout',
      checkoutId,
      { items, expiresAt } as unknown as Prisma.InputJsonValue,
      { userId, ipAddress: ipAddress ?? null },
    );

    this.logger.log({ checkoutId, itemCount: items.length }, 'Inventory reserved');
  }

  // ── Release reservations ────────────────────────────────────────────────────
  //
  // Called when checkout expires or buyer cancels before payment.

  async releaseReservations(
    checkoutId: string,
    reason: 'EXPIRED' | 'CANCELLED' | 'RELEASED',
    userId?: string,
  ): Promise<void> {
    const reservations = await this.prisma.inventoryReservation.findMany({
      where: { checkoutId, status: ReservationStatus.ACTIVE },
      select: { id: true, variantId: true, quantity: true },
    });

    if (reservations.length === 0) return;

    await this.prisma.$transaction(async (tx) => {
      for (const res of reservations) {
        // Decrement reserved count
        await tx.$executeRaw`
          UPDATE inventory
          SET reserved = GREATEST(0, reserved - ${res.quantity}),
              version  = version + 1
          WHERE variant_id = ${res.variantId}
        `;
      }

      await tx.inventoryReservation.updateMany({
        where: { checkoutId, status: ReservationStatus.ACTIVE },
        data: {
          status:
            reason === 'EXPIRED'
              ? ReservationStatus.EXPIRED
              : ReservationStatus.RELEASED,
        },
      });
    });

    void this.domainEvents.emit(
      DomainEventType.INVENTORY_RELEASED,
      'checkout',
      checkoutId,
      { reason, variantCount: reservations.length } as Prisma.InputJsonValue,
      { userId: userId ?? 'system', ipAddress: null },
    );

    this.logger.log({ checkoutId, reason, count: reservations.length }, 'Reservations released');
  }

  // ── Consume reservations ────────────────────────────────────────────────────
  //
  // Called when payment succeeds and order is confirmed.
  // Converts reserved stock into a permanent deduction.

  async consumeReservations(checkoutId: string): Promise<void> {
    const reservations = await this.prisma.inventoryReservation.findMany({
      where: { checkoutId, status: ReservationStatus.ACTIVE },
      select: { id: true, variantId: true, quantity: true },
    });

    if (reservations.length === 0) {
      this.logger.warn({ checkoutId }, 'No active reservations found to consume');
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      for (const res of reservations) {
        await tx.$executeRaw`
          UPDATE inventory
          SET quantity = quantity - ${res.quantity},
              reserved = GREATEST(0, reserved - ${res.quantity}),
              version  = version + 1
          WHERE variant_id = ${res.variantId}
        `;
      }

      await tx.inventoryReservation.updateMany({
        where: { checkoutId, status: ReservationStatus.ACTIVE },
        data: { status: ReservationStatus.CONSUMED },
      });
    });

    this.logger.log({ checkoutId, count: reservations.length }, 'Reservations consumed');
  }

  // ── Scheduled cleanup ───────────────────────────────────────────────────────
  //
  // Runs every minute. Releases expired reservations and marks their
  // checkouts as EXPIRED. Audit-logged for traceability.

  @Cron(CronExpression.EVERY_MINUTE)
  async releaseExpiredReservations(): Promise<void> {
    const now = new Date();

    // Find checkouts with expired but still-active reservations
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

    this.logger.warn(
      { count: expiredCheckouts.length },
      'Releasing expired inventory reservations',
    );

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
