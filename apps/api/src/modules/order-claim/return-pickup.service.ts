import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ClaimActorType,
  OrderClaimStatus,
  PaymentStatus,
  Prisma,
  ReturnPickupStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RiderAssignmentService } from '../rider-assignment/rider-assignment.service';
import { haversineKm } from '../../common/utils/delivery-eta.util';
import { ClaimEligibilityService } from './claim-eligibility.service';
import { ClaimRefundService } from './claim-refund.service';

/** Flat rider fee for a return pickup leg (buyer → store). */
const RETURN_PICKUP_FEE = 30;

export type ReturnPickupAction = 'accept' | 'picked-up' | 'completed';

/**
 * Reverse logistics: when a RETURN claim is approved with pickup enabled, a rider
 * collects the item from the buyer and drops it at the store. The refund is only
 * processed once the store has the item back (status COMPLETED).
 */
@Injectable()
export class ReturnPickupService {
  private readonly logger = new Logger(ReturnPickupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly riders: RiderAssignmentService,
    private readonly eligibility: ClaimEligibilityService,
    private readonly refunds: ClaimRefundService,
  ) {}

  /**
   * Create the pickup for an approved RETURN and try to assign the nearest
   * eligible rider to the buyer. Idempotent — returns the existing pickup if any.
   */
  async scheduleForClaim(claimId: string, actorId: string, actorType: ClaimActorType): Promise<void> {
    const existing = await this.prisma.returnPickup.findUnique({ where: { claimId } });
    if (existing) return;

    const claim = await this.prisma.orderClaim.findUnique({
      where: { id: claimId },
      include: { order: { select: { deliveryLat: true, deliveryLng: true, deliveryAddress: true } }, store: { select: { latitude: true, longitude: true } } },
    });
    if (!claim) throw new NotFoundException('Claim not found');

    const pickup = await this.prisma.returnPickup.create({
      data: {
        claimId,
        storeId: claim.storeId,
        buyerProfileId: claim.buyerProfileId,
        status: ReturnPickupStatus.PENDING,
        pickupLat: claim.order.deliveryLat,
        pickupLng: claim.order.deliveryLng,
        pickupAddress: (claim.order.deliveryAddress ?? undefined) as Prisma.InputJsonValue,
        dropLat: claim.store.latitude ?? null,
        dropLng: claim.store.longitude ?? null,
        riderEarning: RETURN_PICKUP_FEE,
      },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.orderClaim.update({
        where: { id: claimId },
        data: { status: OrderClaimStatus.RETURN_PICKUP_SCHEDULED },
      });
      await this.eligibility.appendHistory(
        tx, claimId, OrderClaimStatus.RETURN_PICKUP_SCHEDULED, actorType, actorId,
        'Return pickup scheduled',
      );
    });

    await this.tryAssignRider(pickup.id, claim.storeId, claim.order.deliveryLat, claim.order.deliveryLng);
  }

  /** Assign the eligible rider nearest the buyer; leaves PENDING if none online. */
  private async tryAssignRider(pickupId: string, storeId: string, buyerLat: number, buyerLng: number): Promise<void> {
    try {
      const candidates = await this.riders.getAvailableRiders(storeId);
      if (!candidates.length) return;
      const best = candidates
        .map((r) => ({ id: r.id, d: haversineKm(r.currentLat!, r.currentLng!, buyerLat, buyerLng) }))
        .sort((a, b) => a.d - b.d)[0];
      await this.prisma.returnPickup.update({
        where: { id: pickupId },
        data: { riderProfileId: best.id, status: ReturnPickupStatus.ASSIGNED, assignedAt: new Date() },
      });
    } catch (err) {
      this.logger.warn({ err, pickupId }, 'Return pickup rider auto-assign failed — left PENDING');
    }
  }

  /** Admin/ops: (re)assign a rider to a still-unassigned or reassignable pickup. */
  async reassignByClaim(claimId: string): Promise<void> {
    const pickup = await this.prisma.returnPickup.findUnique({ where: { claimId }, select: { id: true } });
    if (!pickup) throw new NotFoundException('No return pickup for this claim');
    return this.reassign(pickup.id);
  }

  async reassign(pickupId: string): Promise<void> {
    const pickup = await this.prisma.returnPickup.findUnique({ where: { id: pickupId } });
    if (!pickup) throw new NotFoundException('Return pickup not found');
    if (pickup.status !== ReturnPickupStatus.PENDING && pickup.status !== ReturnPickupStatus.ASSIGNED) {
      throw new BadRequestException(`Cannot reassign a pickup in status ${pickup.status}`);
    }
    await this.tryAssignRider(pickupId, pickup.storeId, pickup.pickupLat, pickup.pickupLng);
  }

  /** Active pickups offered to / handled by this rider. */
  async listForRider(riderProfileId: string) {
    return this.prisma.returnPickup.findMany({
      where: {
        riderProfileId,
        status: { in: [ReturnPickupStatus.ASSIGNED, ReturnPickupStatus.ACCEPTED, ReturnPickupStatus.PICKED_UP] },
      },
      include: {
        claim: { select: { claimNumber: true, reason: true } },
        store: { select: { name: true, latitude: true, longitude: true, line1: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Rider progresses a pickup: accept → picked-up → completed (triggers refund). */
  async riderTransition(pickupId: string, riderProfileId: string, action: ReturnPickupAction) {
    const pickup = await this.prisma.returnPickup.findUnique({ where: { id: pickupId } });
    if (!pickup) throw new NotFoundException('Return pickup not found');
    if (pickup.riderProfileId !== riderProfileId) {
      throw new BadRequestException('This pickup is not assigned to you');
    }

    switch (action) {
      case 'accept':
        this.assertStatus(pickup.status, ReturnPickupStatus.ASSIGNED);
        await this.prisma.returnPickup.update({
          where: { id: pickupId },
          data: { status: ReturnPickupStatus.ACCEPTED, acceptedAt: new Date() },
        });
        break;
      case 'picked-up':
        this.assertStatus(pickup.status, ReturnPickupStatus.ACCEPTED);
        await this.prisma.$transaction(async (tx) => {
          await tx.returnPickup.update({
            where: { id: pickupId },
            data: { status: ReturnPickupStatus.PICKED_UP, pickedUpAt: new Date() },
          });
          await tx.orderClaim.update({
            where: { id: pickup.claimId },
            data: { status: OrderClaimStatus.RETURN_PICKED_UP },
          });
          await this.eligibility.appendHistory(
            tx, pickup.claimId, OrderClaimStatus.RETURN_PICKED_UP, ClaimActorType.SYSTEM, riderProfileId,
            'Item collected from buyer',
          );
        });
        break;
      case 'completed':
        this.assertStatus(pickup.status, ReturnPickupStatus.PICKED_UP);
        await this.complete(pickup.id, pickup.claimId, riderProfileId, ClaimActorType.SYSTEM);
        break;
      default:
        throw new BadRequestException('Unknown action');
    }
    return this.prisma.returnPickup.findUnique({ where: { id: pickupId } });
  }

  /**
   * Store received the returned item → refund. Callable by the rider (delivered
   * to store) or by an admin as a manual safety valve.
   */
  async complete(pickupId: string, claimId: string, actorId: string, actorType: ClaimActorType): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.returnPickup.update({
        where: { id: pickupId },
        data: { status: ReturnPickupStatus.COMPLETED, completedAt: new Date() },
      });
      await tx.orderClaim.update({
        where: { id: claimId },
        data: { status: OrderClaimStatus.RETURN_RECEIVED },
      });
      await this.eligibility.appendHistory(
        tx, claimId, OrderClaimStatus.RETURN_RECEIVED, actorType, actorId,
        'Returned item received at store',
      );
      await tx.orderClaim.update({
        where: { id: claimId },
        data: { status: OrderClaimStatus.REFUND_PROCESSING },
      });
    });
    // Refund now that the item is back. Idempotent + re-entrant.
    await this.refunds.processRefund(claimId, actorId, actorType);
  }

  /** Rider can't do an assigned pickup → release it back to the pool (PENDING). */
  async riderDecline(pickupId: string, riderProfileId: string): Promise<void> {
    const pickup = await this.prisma.returnPickup.findUnique({ where: { id: pickupId } });
    if (!pickup) throw new NotFoundException('Return pickup not found');
    if (pickup.riderProfileId !== riderProfileId) {
      throw new BadRequestException('This pickup is not assigned to you');
    }
    if (pickup.status !== ReturnPickupStatus.ASSIGNED && pickup.status !== ReturnPickupStatus.ACCEPTED) {
      throw new BadRequestException(`Cannot decline a pickup in status ${pickup.status}`);
    }
    await this.prisma.returnPickup.update({
      where: { id: pickupId },
      data: { riderProfileId: null, status: ReturnPickupStatus.PENDING, assignedAt: null, acceptedAt: null },
    });
  }

  /**
   * Cancel a scheduled return pickup (admin) — e.g. the buyer no longer wants to
   * return. The claim reverts to APPROVED so an admin can re-decide (reschedule,
   * refund without pickup, or reject). Cannot cancel once the item is at the store.
   */
  async cancel(claimId: string, actorId: string, actorType: ClaimActorType): Promise<void> {
    const pickup = await this.prisma.returnPickup.findUnique({ where: { claimId } });
    if (!pickup) throw new NotFoundException('No return pickup for this claim');
    if (pickup.status === ReturnPickupStatus.COMPLETED) {
      throw new BadRequestException('Pickup already completed — cannot cancel');
    }
    if (pickup.status === ReturnPickupStatus.CANCELLED) return;
    await this.prisma.$transaction(async (tx) => {
      await tx.returnPickup.update({
        where: { id: pickup.id },
        data: { status: ReturnPickupStatus.CANCELLED, cancelledAt: new Date(), riderProfileId: null },
      });
      await tx.orderClaim.update({ where: { id: claimId }, data: { status: OrderClaimStatus.APPROVED } });
      await this.eligibility.appendHistory(
        tx, claimId, OrderClaimStatus.APPROVED, actorType, actorId, 'Return pickup cancelled',
      );
    });
  }

  /** Admin marks the return received (rider offline / manual reconciliation). */
  async adminMarkReceived(claimId: string, adminId: string): Promise<void> {
    const pickup = await this.prisma.returnPickup.findUnique({ where: { claimId } });
    if (!pickup) throw new NotFoundException('No return pickup for this claim');
    if (pickup.status === ReturnPickupStatus.COMPLETED) return;
    await this.complete(pickup.id, claimId, adminId, ClaimActorType.ADMIN);
  }

  private assertStatus(actual: ReturnPickupStatus, expected: ReturnPickupStatus): void {
    if (actual !== expected) {
      throw new BadRequestException(`Pickup must be ${expected} for this action (is ${actual})`);
    }
  }

  /** Guard used elsewhere: is a claim's refund already done? */
  async isRefunded(claimId: string): Promise<boolean> {
    const r = await this.prisma.claimRefund.findUnique({ where: { claimId }, select: { status: true } });
    return r?.status === PaymentStatus.REFUNDED;
  }
}
