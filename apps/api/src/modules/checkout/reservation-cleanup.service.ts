import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CheckoutStatus, DomainEventType, Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';

/**
 * Runs every 5 minutes. Finds ACTIVE reservations past their expiresAt,
 * releases the reserved stock, and marks both the reservation and checkout
 * as EXPIRED.
 *
 * Design: each reservation is processed in its own transaction so a single
 * failure does not block the entire batch. The job is idempotent — re-running
 * it on an already-expired reservation is a no-op (status guard).
 */
@Injectable()
export class ReservationCleanupService {
  private readonly logger = new Logger(ReservationCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async releaseExpiredReservations(): Promise<void> {
    const now = new Date();

    const expired = await this.prisma.inventoryReservation.findMany({
      where: { status: ReservationStatus.ACTIVE, expiresAt: { lt: now } },
      select: { id: true, checkoutId: true, variantId: true, quantity: true },
    });

    if (expired.length === 0) return;

    this.logger.log(`Releasing ${expired.length} expired reservation(s)`);

    for (const res of expired) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Guard: re-check status inside tx (may already be released)
          const current = await tx.inventoryReservation.findUnique({
            where: { id: res.id },
            select: { status: true },
          });
          if (!current || current.status !== ReservationStatus.ACTIVE) return;

          // Release reserved stock
          await tx.inventory.update({
            where: { variantId: res.variantId },
            data: {
              availableQty: { increment: res.quantity },
              reservedQty: { decrement: res.quantity },
              version: { increment: 1 },
            },
          });

          await tx.inventoryReservation.update({
            where: { id: res.id },
            data: { status: ReservationStatus.EXPIRED },
          });
        });
      } catch (err) {
        this.logger.error(
          `Failed to release reservation ${res.id}: ${(err as Error).message}`,
        );
      }
    }

    // Bulk-expire any checkout that is past expiresAt and still in RESERVED state
    const expiredCheckouts = await this.prisma.checkout.updateMany({
      where: { status: CheckoutStatus.RESERVED, expiresAt: { lt: now } },
      data: { status: CheckoutStatus.EXPIRED },
    });

    if (expiredCheckouts.count > 0) {
      this.logger.log(`Expired ${expiredCheckouts.count} checkout(s)`);

      void this.domainEvents.emit(
        DomainEventType.INVENTORY_RELEASED,
        'checkout',
        'batch',
        { releasedReservations: expired.length, expiredCheckouts: expiredCheckouts.count },
        { userId: 'system', ipAddress: null },
      );
    }

    // Purge IdempotencyKey records past their expiresAt (housekeeping)
    await this.prisma.idempotencyKey.deleteMany({
      where: { expiresAt: { lt: now } },
    });
  }
}
