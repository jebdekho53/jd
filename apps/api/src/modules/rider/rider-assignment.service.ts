import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignmentStatus,
  DeliveryStatus,
  DomainEventType,
  KycStatus,
  OrderStatus,
  Prisma,
  RiderStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';

/** Time a rider has to accept an offered assignment before it expires. */
const ASSIGNMENT_TTL_MINUTES = 3;

/** Maximum concurrent active deliveries per rider. */
const MAX_ACTIVE_DELIVERIES = 1;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class RiderAssignmentService {
  private readonly logger = new Logger(RiderAssignmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
  ) {}

  // ── Manual assignment (admin) ─────────────────────────────────────────────

  async assignRider(
    orderId: string,
    riderProfileId: string,
    adminUserId: string,
    ipAddress?: string,
  ): Promise<{ deliveryId: string; riderProfileId: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { store: { select: { id: true, latitude: true, longitude: true } }, delivery: true },
    });

    if (!order) throw new NotFoundException(`Order not found: ${orderId}`);
    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      throw new BadRequestException(
        `Order must be in READY_FOR_PICKUP status to assign a rider. Current: ${order.status}`,
      );
    }
    if (order.delivery?.status === DeliveryStatus.ASSIGNED || order.delivery?.status === DeliveryStatus.ACCEPTED) {
      throw new BadRequestException('Order already has an active delivery assignment');
    }

    const rider = await this.prisma.riderProfile.findUnique({
      where: { id: riderProfileId },
      select: { id: true, status: true, kycStatus: true, currentLat: true, currentLng: true },
    });
    if (!rider) throw new NotFoundException(`Rider not found: ${riderProfileId}`);
    if (rider.kycStatus !== KycStatus.APPROVED) {
      throw new BadRequestException('Rider KYC is not approved');
    }
    if (rider.status === RiderStatus.OFFLINE) {
      throw new BadRequestException('Rider is offline');
    }

    const delivery = await this.upsertDelivery(order, riderProfileId);
    await this.createAssignmentRecord(delivery.id, riderProfileId);

    await this.finishAssignment(delivery.id, orderId, riderProfileId, order.orderNumber, adminUserId, ipAddress, false);

    return { deliveryId: delivery.id, riderProfileId };
  }

  // ── Reassignment (admin) ──────────────────────────────────────────────────

  async reassignRider(
    orderId: string,
    newRiderProfileId: string,
    adminUserId: string,
    ipAddress?: string,
  ): Promise<{ deliveryId: string; riderProfileId: string }> {
    const delivery = await this.prisma.delivery.findFirst({
      where: { orderId },
      include: { order: { select: { id: true, orderNumber: true, status: true } } },
    });
    if (!delivery) throw new NotFoundException('Delivery record not found for this order');

    const cancellableStatuses = new Set<DeliveryStatus>([
      DeliveryStatus.ASSIGNED,
      DeliveryStatus.ACCEPTED,
      DeliveryStatus.ARRIVED_AT_STORE,
    ]);
    if (!cancellableStatuses.has(delivery.status)) {
      throw new BadRequestException(
        `Cannot reassign: delivery is in status ${delivery.status}`,
      );
    }

    // Cancel the previous rider's assignment
    if (delivery.riderProfileId) {
      await this.prisma.deliveryAssignment.updateMany({
        where: {
          deliveryId: delivery.id,
          riderProfileId: delivery.riderProfileId,
          status: { in: [AssignmentStatus.OFFERED, AssignmentStatus.ACCEPTED] },
        },
        data: { status: AssignmentStatus.CANCELLED },
      });

      // Release previous rider back to ONLINE
      await this.prisma.riderProfile.update({
        where: { id: delivery.riderProfileId },
        data: { status: RiderStatus.ONLINE },
      });
    }

    const newRider = await this.prisma.riderProfile.findUnique({
      where: { id: newRiderProfileId },
      select: { id: true, status: true, kycStatus: true },
    });
    if (!newRider) throw new NotFoundException(`Rider not found: ${newRiderProfileId}`);
    if (newRider.kycStatus !== KycStatus.APPROVED) {
      throw new BadRequestException('New rider KYC is not approved');
    }

    await this.createAssignmentRecord(delivery.id, newRiderProfileId);
    await this.finishAssignment(
      delivery.id, orderId, newRiderProfileId, delivery.order.orderNumber,
      adminUserId, ipAddress, true,
    );

    return { deliveryId: delivery.id, riderProfileId: newRiderProfileId };
  }

  // ── Auto assignment ────────────────────────────────────────────────────────
  //
  // Priority: same zone > online > lowest active deliveries > nearest to store.

  async autoAssign(orderId: string): Promise<{ deliveryId: string; riderProfileId: string } | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: {
          select: {
            id: true,
            latitude: true,
            longitude: true,
            storeZones: { select: { zoneId: true } },
          },
        },
        delivery: true,
      },
    });

    if (!order || order.status !== OrderStatus.READY_FOR_PICKUP) return null;
    if (order.delivery?.status === DeliveryStatus.ASSIGNED) return null;

    const storeZoneIds = order.store.storeZones.map((z) => z.zoneId);

    // Fetch all eligible riders (ONLINE or BUSY but only if BUSY means on a delivery
    // and we're allowing queue — for simplicity only ONLINE here)
    const eligibleRiders = await this.prisma.riderProfile.findMany({
      where: {
        kycStatus: KycStatus.APPROVED,
        status: RiderStatus.ONLINE,
        currentLat: { not: null },
        currentLng: { not: null },
      },
      select: {
        id: true,
        currentLat: true,
        currentLng: true,
        zones: { select: { zoneId: true } },
        _count: {
          select: {
            deliveries: {
              where: { status: { in: [DeliveryStatus.ASSIGNED, DeliveryStatus.ACCEPTED, DeliveryStatus.PICKED_UP, DeliveryStatus.ARRIVED_AT_STORE] } },
            },
          },
        },
      },
    });

    if (eligibleRiders.length === 0) {
      this.logger.warn({ orderId }, 'Auto-assign: no eligible riders found');
      return null;
    }

    // Filter riders at max capacity
    const available = eligibleRiders.filter(
      (r) => r._count.deliveries < MAX_ACTIVE_DELIVERIES,
    );
    if (available.length === 0) {
      this.logger.warn({ orderId }, 'Auto-assign: all eligible riders at capacity');
      return null;
    }

    const storeLat = order.store.latitude ?? 0;
    const storeLng = order.store.longitude ?? 0;

    // Score each rider
    const scored = available.map((rider) => {
      const inZone = rider.zones.some((z) => storeZoneIds.includes(z.zoneId)) ? 0 : 1;
      const activeDeliveries = rider._count.deliveries;
      const distKm = haversineKm(
        rider.currentLat ?? 0,
        rider.currentLng ?? 0,
        storeLat,
        storeLng,
      );
      // Lower score = better. Zone match is highest priority.
      return { id: rider.id, score: inZone * 1000 + activeDeliveries * 10 + distKm };
    });

    scored.sort((a, b) => a.score - b.score);
    const bestRider = scored[0];

    const delivery = await this.upsertDelivery(order, bestRider.id);
    await this.createAssignmentRecord(delivery.id, bestRider.id);
    await this.finishAssignment(
      delivery.id, orderId, bestRider.id, order.orderNumber,
      'system', undefined, false,
    );

    this.logger.log({ orderId, riderId: bestRider.id }, 'Auto-assigned rider');
    return { deliveryId: delivery.id, riderProfileId: bestRider.id };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async upsertDelivery(order: any, riderProfileId: string) {
    const storeLat: number = order.store?.latitude ?? 0;
    const storeLng: number = order.store?.longitude ?? 0;
    const deliveryLat: number = order.deliveryLat ?? 0;
    const deliveryLng: number = order.deliveryLng ?? 0;

    const distanceKm = haversineKm(storeLat, storeLng, deliveryLat, deliveryLng);

    if (order.delivery) {
      return this.prisma.delivery.update({
        where: { id: order.delivery.id },
        data: { riderProfileId, status: DeliveryStatus.ASSIGNED, assignedAt: new Date() },
      });
    }

    return this.prisma.delivery.create({
      data: {
        orderId: order.id,
        riderProfileId,
        status: DeliveryStatus.ASSIGNED,
        pickupLat: storeLat,
        pickupLng: storeLng,
        deliveryLat,
        deliveryLng,
        distanceKm,
        assignedAt: new Date(),
      },
    });
  }

  private async createAssignmentRecord(deliveryId: string, riderProfileId: string) {
    const expiresAt = new Date(Date.now() + ASSIGNMENT_TTL_MINUTES * 60 * 1000);

    await this.prisma.deliveryAssignment.create({
      data: {
        deliveryId,
        riderProfileId,
        status: AssignmentStatus.OFFERED,
        expiresAt,
      },
    });
  }

  private async finishAssignment(
    deliveryId: string,
    orderId: string,
    riderProfileId: string,
    orderNumber: string,
    actorId: string,
    ipAddress?: string,
    isReassignment = false,
  ): Promise<void> {
    await this.prisma.$transaction([
      // Advance order to RIDER_ASSIGNED
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.RIDER_ASSIGNED },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.RIDER_ASSIGNED,
          note: isReassignment ? 'Rider reassigned by admin' : 'Rider assigned',
          changedBy: actorId,
        },
      }),
      // Rider becomes BUSY
      this.prisma.riderProfile.update({
        where: { id: riderProfileId },
        data: { status: RiderStatus.BUSY },
      }),
    ]);

    await Promise.all([
      this.audit.log({
        actorId,
        action: isReassignment ? 'RIDER_REASSIGNED' : 'RIDER_ASSIGNED',
        resourceType: 'delivery',
        resourceId: deliveryId,
        ipAddress,
        metadata: { orderId, orderNumber, riderProfileId } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.RIDER_ASSIGNED,
        'delivery',
        deliveryId,
        { orderId, riderProfileId, isReassignment } as Prisma.InputJsonValue,
        { userId: actorId, ipAddress: ipAddress ?? null },
      ),
    ]);
  }
}
