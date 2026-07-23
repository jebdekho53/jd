import { envInt } from '../../config/env-int.util';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  AssignmentStatus,
  DeliveryStatus,
  DomainEventType,
  KycStatus,
  OrderActorType,
  OrderStatus,
  Prisma,
  RiderStatus,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { startOfIstDay } from '../../common/utils/ist-day.util';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { RiderAssignmentCacheService } from './rider-assignment-cache.service';
import { safeDistanceKm } from '../../common/utils/delivery-eta.util';
import {
  ASSIGNMENT_OFFER_SECONDS,
  MAX_ACTIVE_DELIVERIES,
  haversineKm,
  isActiveDeliveryStatus,
  minutesSince,
  scoreRider,
  unassignedOrderWhere,
  type ScoredRider,
} from './rider-assignment.util';
import { generateHandoverOtp } from '../rider/delivery-otp.util';
import { BuyerPushNotificationService } from '../push/buyer-push-notification.service';
import { RiderPushNotificationService } from '../push/rider-push-notification.service';
import { EmailNotificationService } from '../email/email-notification.service';

export const RIDER_ASSIGNMENT_EVENTS = {
  ASSIGNED: 'order.assigned',
  REASSIGNED: 'order.reassigned',
  UNASSIGNED: 'order.unassigned',
  LOCATION_UPDATED: 'rider.location.updated',
} as const;

@Injectable()
export class RiderAssignmentService {
  private readonly logger = new Logger(RiderAssignmentService.name);
  private readonly autoAcceptSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly domainEvents: DomainEventsService,
    private readonly statusHistory: OrderStatusHistoryService,
    private readonly cache: RiderAssignmentCacheService,
    private readonly events: EventEmitter2,
    private readonly buyerPush: BuyerPushNotificationService,
    private readonly riderPush: RiderPushNotificationService,
    private readonly emailNotifications: EmailNotificationService,
    config: ConfigService,
  ) {
    this.autoAcceptSeconds = envInt(config, 'RIDER_AUTO_ACCEPT_SECONDS', ASSIGNMENT_OFFER_SECONDS);
  }

  async autoAssign(orderId: string): Promise<{ deliveryId: string; riderProfileId: string } | null> {
    const best = await this.findBestRider(orderId);
    if (!best) return null;
    return this.assign(orderId, best.id, 'system');
  }

  async assign(
    orderId: string,
    riderProfileId: string,
    assignedBy: string,
    ipAddress?: string,
  ): Promise<{ deliveryId: string; riderProfileId: string }> {
    await this.assertRiderEligible(riderProfileId, orderId);
    const order = await this.requireAssignableOrder(orderId);

    const delivery = await this.upsertDelivery(order, riderProfileId, assignedBy);
    await this.createAssignmentRecord(delivery.id, riderProfileId, assignedBy);
    await this.finishAssignment({
      deliveryId: delivery.id,
      orderId,
      riderProfileId,
      orderNumber: order.orderNumber,
      actorId: assignedBy,
      ipAddress,
      isReassignment: false,
      event: RIDER_ASSIGNMENT_EVENTS.ASSIGNED,
    });

    return { deliveryId: delivery.id, riderProfileId };
  }

  async reassign(
    orderId: string,
    riderProfileId: string,
    assignedBy: string,
    ipAddress?: string,
  ): Promise<{ deliveryId: string; riderProfileId: string }> {
    const delivery = await this.prisma.delivery.findFirst({
      where: { orderId },
      include: { order: { select: { id: true, orderNumber: true, status: true } } },
    });
    if (!delivery) throw new NotFoundException('Delivery record not found for this order');

    const cancellable = new Set<DeliveryStatus>([
      DeliveryStatus.ASSIGNED,
      DeliveryStatus.ACCEPTED,
      DeliveryStatus.ARRIVED_AT_STORE,
    ]);
    if (!cancellable.has(delivery.status)) {
      throw new BadRequestException(`Cannot reassign: delivery is in status ${delivery.status}`);
    }

    if (delivery.riderProfileId) {
      await this.prisma.deliveryAssignment.updateMany({
        where: {
          deliveryId: delivery.id,
          riderProfileId: delivery.riderProfileId,
          status: { in: [AssignmentStatus.OFFERED, AssignmentStatus.ACCEPTED] },
        },
        data: { status: AssignmentStatus.CANCELLED, respondedAt: new Date() },
      });
      await this.prisma.riderProfile.update({
        where: { id: delivery.riderProfileId },
        data: { status: RiderStatus.ONLINE },
      });
    }

    await this.assertRiderEligible(riderProfileId, orderId);

    await this.prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        riderProfileId,
        status: DeliveryStatus.ASSIGNED,
        assignedAt: new Date(),
        assignedBy,
      },
    });

    await this.createAssignmentRecord(delivery.id, riderProfileId, assignedBy);
    await this.finishAssignment({
      deliveryId: delivery.id,
      orderId,
      riderProfileId,
      orderNumber: delivery.order.orderNumber,
      actorId: assignedBy,
      ipAddress,
      isReassignment: true,
      event: RIDER_ASSIGNMENT_EVENTS.REASSIGNED,
    });

    return { deliveryId: delivery.id, riderProfileId };
  }

  async unassign(orderId: string, actorId: string, ipAddress?: string): Promise<void> {
    const delivery = await this.prisma.delivery.findFirst({
      where: { orderId },
      include: { order: { select: { orderNumber: true } } },
    });
    if (!delivery) throw new NotFoundException('No delivery found for this order');

    const terminalUnassign = new Set<DeliveryStatus>([
      DeliveryStatus.PICKED_UP,
      DeliveryStatus.ARRIVED_AT_CUSTOMER,
      DeliveryStatus.DELIVERED,
    ]);
    if (terminalUnassign.has(delivery.status)) {
      throw new BadRequestException(`Cannot unassign delivery in status ${delivery.status}`);
    }

    if (delivery.riderProfileId) {
      await this.prisma.deliveryAssignment.updateMany({
        where: {
          deliveryId: delivery.id,
          status: { in: [AssignmentStatus.OFFERED, AssignmentStatus.ACCEPTED] },
        },
        data: { status: AssignmentStatus.CANCELLED, respondedAt: new Date() },
      });
      await this.prisma.riderProfile.update({
        where: { id: delivery.riderProfileId },
        data: { status: RiderStatus.ONLINE },
      });
    }

    await this.prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        riderProfileId: null,
        status: DeliveryStatus.CANCELLED,
        assignedAt: null,
        assignedBy: null,
      },
    });

    await this.statusHistory.transition({
      orderId,
      toStatus: OrderStatus.READY_FOR_PICKUP,
      actorType: OrderActorType.ADMIN,
      actorId,
      note: 'Rider unassigned — returned to pickup queue',
      skipIfAlreadyStatus: false,
    });

    await this.audit.log({
      actorId,
      action: 'RIDER_UNASSIGNED',
      resourceType: 'delivery',
      resourceId: delivery.id,
      ipAddress,
      metadata: { orderId } as Prisma.InputJsonValue,
    });

    await this.cache.invalidateAssignmentCaches(orderId);
    this.emitWs(RIDER_ASSIGNMENT_EVENTS.UNASSIGNED, { orderId, deliveryId: delivery.id });
  }

  async findBestRider(orderId: string): Promise<ScoredRider | null> {
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
    if (order.delivery && isActiveDeliveryStatus(order.delivery.status)) return null;

    const fulfillmentStoreId = await this.resolveFulfillmentStoreId(orderId, order.store.id);
    const pickupStore = fulfillmentStoreId !== order.store.id
      ? await this.prisma.store.findUnique({
          where: { id: fulfillmentStoreId },
          select: {
            id: true,
            latitude: true,
            longitude: true,
            storeZones: { select: { zoneId: true } },
          },
        })
      : order.store;

    const riders = await this.getEligibleRidersForStore(pickupStore?.id ?? order.store.id);
    if (riders.length === 0) return null;

    const storeLat = pickupStore?.latitude ?? order.store.latitude ?? 0;
    const storeLng = pickupStore?.longitude ?? order.store.longitude ?? 0;

    const scored = riders.map((rider) => {
      const distKm = haversineKm(rider.currentLat!, rider.currentLng!, storeLat, storeLng);
      const idleMins = rider.lastLocationAt ? minutesSince(rider.lastLocationAt) : minutesSince(rider.updatedAt);
      const score = scoreRider({
        inZone: rider.inZone,
        activeDeliveries: rider.activeDeliveries,
        distanceKm: distKm,
        idleMins,
      });
      return {
        id: rider.id,
        activeDeliveries: rider.activeDeliveries,
        distanceKm: Math.round(distKm * 100) / 100,
        idleMins,
        inZone: rider.inZone,
        score,
      };
    });

    scored.sort((a, b) => a.score - b.score);
    const best = scored[0];
    return best.score === Number.POSITIVE_INFINITY ? null : best;
  }

  async getAvailableRiders(storeId: string) {
    return this.getEligibleRidersForStore(storeId, true);
  }

  async listUnassignedOrders(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = unassignedOrderWhere();

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentMethod: true,
          totalAmount: true,
          createdAt: true,
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              merchantProfile: { select: { id: true, businessName: true } },
              storeZones: { select: { zone: { select: { id: true, name: true } } } },
            },
          },
          buyerProfile: { select: { name: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    const enriched = await Promise.all(
      orders.map(async (order) => ({
        ...order,
        totalAmount: Number(order.totalAmount),
        merchant: order.store?.merchantProfile ?? null,
        zones: order.store?.storeZones.map((sz) => sz.zone) ?? [],
        availableRiderCount: order.store
          ? (await this.getAvailableRiders(order.store.id)).length
          : 0,
        needsRider: true,
      })),
    );

    return {
      orders: enriched,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async listLiveRiders(filters?: { status?: string }) {
    const where: Prisma.RiderProfileWhereInput = {
      user: { status: UserStatus.ACTIVE, deletedAt: null },
    };

    if (filters?.status === 'ONLINE') where.status = RiderStatus.ONLINE;
    else if (filters?.status === 'OFFLINE') where.status = RiderStatus.OFFLINE;
    else if (filters?.status === 'BUSY') {
      where.status = { in: [RiderStatus.BUSY, RiderStatus.ON_DELIVERY] };
    } else if (filters?.status === 'SUSPENDED') {
      where.user = { status: UserStatus.SUSPENDED };
    }

    const riders = await this.prisma.riderProfile.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 200,
      select: {
        id: true,
        name: true,
        status: true,
        kycStatus: true,
        vehicleType: true,
        currentLat: true,
        currentLng: true,
        lastLocationAt: true,
        updatedAt: true,
        user: { select: { phone: true, status: true } },
        zones: { select: { zone: { select: { id: true, name: true } } } },
        deliveries: {
          where: { status: { in: [DeliveryStatus.ASSIGNED, DeliveryStatus.ACCEPTED, DeliveryStatus.PICKED_UP, DeliveryStatus.ARRIVED_AT_STORE, DeliveryStatus.ARRIVED_AT_CUSTOMER] } },
          take: 1,
          orderBy: { assignedAt: 'desc' },
          select: {
            id: true,
            status: true,
            order: { select: { orderNumber: true } },
          },
        },
        _count: {
          select: {
            deliveries: {
              where: {
                status: {
                  in: [
                    DeliveryStatus.ASSIGNED,
                    DeliveryStatus.ACCEPTED,
                    DeliveryStatus.PICKED_UP,
                    DeliveryStatus.ARRIVED_AT_STORE,
                    DeliveryStatus.ARRIVED_AT_CUSTOMER,
                  ],
                },
              },
            },
          },
        },
      },
    });

    return riders.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.user.phone,
      userStatus: r.user.status,
      zone: r.zones.map((z) => z.zone.name).join(', ') || '—',
      status: r.status,
      kycStatus: r.kycStatus,
      vehicleType: r.vehicleType,
      currentDelivery: r.deliveries[0]
        ? { orderNumber: r.deliveries[0].order.orderNumber, status: r.deliveries[0].status }
        : null,
      lastLocation:
        r.currentLat != null && r.currentLng != null
          ? { lat: r.currentLat, lng: r.currentLng }
          : null,
      lastSeen: r.lastLocationAt ?? r.updatedAt,
      activeDeliveries: r._count.deliveries,
    }));
  }

  async getMetrics() {
    const todayStart = startOfIstDay();

    const [
      unassignedCount,
      onlineRiders,
      busyRiders,
      idleRiders,
      assignedToday,
      avgAssignmentMs,
    ] = await Promise.all([
      this.prisma.order.count({ where: unassignedOrderWhere() }),
      this.prisma.riderProfile.count({
        where: { status: RiderStatus.ONLINE, user: { status: UserStatus.ACTIVE } },
      }),
      this.prisma.riderProfile.count({
        where: { status: { in: [RiderStatus.BUSY, RiderStatus.ON_DELIVERY] } },
      }),
      this.prisma.riderProfile.count({
        where: { status: RiderStatus.ONLINE, user: { status: UserStatus.ACTIVE } },
      }),
      this.prisma.delivery.count({ where: { assignedAt: { gte: todayStart } } }),
      this.prisma.delivery.aggregate({
        where: { assignedAt: { gte: todayStart } },
        _avg: { estimatedMins: true },
      }),
    ]);

    const successRate =
      assignedToday > 0
        ? Math.round((assignedToday / (assignedToday + unassignedCount)) * 1000) / 10
        : 0;

    return {
      unassignedOrders: unassignedCount,
      onlineRiders,
      busyRiders,
      idleRiders,
      assignmentSuccessRate: successRate,
      avgAssignmentTimeMins: avgAssignmentMs._avg.estimatedMins ?? 0,
      assignmentsToday: assignedToday,
    };
  }

  /** Process expired offers — the rider never responded, so free them and
   *  re-offer the order to the next best rider rather than binding them to a
   *  delivery they never agreed to. */
  async processPendingOffers(): Promise<void> {
    const now = new Date();
    const pending = await this.prisma.deliveryAssignment.findMany({
      where: { status: AssignmentStatus.OFFERED, expiresAt: { lte: now } },
      include: {
        delivery: { include: { order: { select: { id: true } } } },
      },
      take: 50,
    });

    for (const offer of pending) {
      await this.expireOffer(offer.id, offer.delivery.id, offer.riderProfileId, offer.delivery.orderId);
    }
  }

  async rejectOffer(userId: string, orderId: string): Promise<void> {
    const rider = await this.prisma.riderProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!rider) throw new NotFoundException('Rider profile not found');

    const delivery = await this.prisma.delivery.findFirst({
      where: { orderId, riderProfileId: rider.id },
    });
    if (!delivery || delivery.status !== DeliveryStatus.ASSIGNED) {
      throw new BadRequestException('No pending assignment to reject');
    }

    await this.prisma.deliveryAssignment.updateMany({
      where: { deliveryId: delivery.id, riderProfileId: rider.id, status: AssignmentStatus.OFFERED },
      data: { status: AssignmentStatus.REJECTED, respondedAt: new Date() },
    });

    await this.prisma.delivery.update({
      where: { id: delivery.id },
      data: { riderProfileId: null, status: DeliveryStatus.CANCELLED },
    });

    await this.prisma.riderProfile.update({
      where: { id: rider.id },
      data: { status: RiderStatus.ONLINE },
    });

    await this.statusHistory.transition({
      orderId,
      toStatus: OrderStatus.READY_FOR_PICKUP,
      actorType: OrderActorType.RIDER,
      actorId: userId,
      note: 'Rider rejected assignment',
    });

    await this.cache.invalidateAssignmentCaches(orderId);
    void this.autoAssign(orderId);
  }

  // Legacy aliases
  assignRider = this.assign;
  reassignRider = this.reassign;
  listAvailableRidersForStore = this.getAvailableRiders;
  countAvailableRidersForStore = async (storeId: string) =>
    (await this.getAvailableRiders(storeId)).length;

  private async expireOffer(
    assignmentId: string,
    deliveryId: string,
    riderProfileId: string,
    orderId: string,
  ) {
    await this.prisma.deliveryAssignment.update({
      where: { id: assignmentId },
      data: { status: AssignmentStatus.EXPIRED, respondedAt: new Date() },
    });
    await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { riderProfileId: null, status: DeliveryStatus.CANCELLED },
    });
    await this.prisma.riderProfile.update({
      where: { id: riderProfileId },
      data: { status: RiderStatus.ONLINE },
    });
    await this.statusHistory.transition({
      orderId,
      toStatus: OrderStatus.READY_FOR_PICKUP,
      actorType: OrderActorType.SYSTEM,
      note: 'Assignment offer expired',
    });
    await this.cache.invalidateAssignmentCaches(orderId);
    void this.autoAssign(orderId);
  }

  private async getEligibleRidersForStore(storeId: string, withDetails = false) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: {
        latitude: true,
        longitude: true,
        storeZones: { select: { zoneId: true } },
      },
    });
    if (!store) return [];

    const storeZoneIds = store.storeZones.map((z) => z.zoneId);
    if (storeZoneIds.length === 0) return [];

    const storeLat = store.latitude ?? 0;
    const storeLng = store.longitude ?? 0;

    const riders = await this.prisma.riderProfile.findMany({
      where: {
        kycStatus: KycStatus.APPROVED,
        status: RiderStatus.ONLINE,
        currentLat: { not: null },
        currentLng: { not: null },
        user: { status: UserStatus.ACTIVE, deletedAt: null },
        zones: { some: { zoneId: { in: storeZoneIds } } },
      },
      select: {
        id: true,
        name: true,
        status: true,
        currentLat: true,
        currentLng: true,
        lastLocationAt: true,
        updatedAt: true,
        zones: { select: { zoneId: true, zone: { select: { id: true, name: true } } } },
        _count: {
          select: {
            deliveries: {
              where: {
                status: {
                  in: [
                    DeliveryStatus.ASSIGNED,
                    DeliveryStatus.ACCEPTED,
                    DeliveryStatus.PICKED_UP,
                    DeliveryStatus.ARRIVED_AT_STORE,
                  ],
                },
              },
            },
          },
        },
      },
    });

    return riders
      .filter((r) => r._count.deliveries < MAX_ACTIVE_DELIVERIES)
      .map((rider) => {
        const inZone = rider.zones.some((z) => storeZoneIds.includes(z.zoneId));
        const distKm = haversineKm(rider.currentLat!, rider.currentLng!, storeLat, storeLng);
        const base = {
          id: rider.id,
          name: rider.name,
          status: rider.status,
          inZone,
          activeDeliveries: rider._count.deliveries,
          distanceKm: Math.round(distKm * 100) / 100,
          currentLat: rider.currentLat,
          currentLng: rider.currentLng,
          lastLocationAt: rider.lastLocationAt,
          updatedAt: rider.updatedAt,
        };
        if (!withDetails) return base;
        return { ...base, zones: rider.zones.map((z) => z.zone) };
      })
      .filter((r) => r.inZone)
      .sort((a, b) => {
        const scoreA = scoreRider({
          inZone: a.inZone,
          activeDeliveries: a.activeDeliveries,
          distanceKm: a.distanceKm,
          idleMins: a.lastLocationAt ? minutesSince(a.lastLocationAt) : 0,
        });
        const scoreB = scoreRider({
          inZone: b.inZone,
          activeDeliveries: b.activeDeliveries,
          distanceKm: b.distanceKm,
          idleMins: b.lastLocationAt ? minutesSince(b.lastLocationAt) : 0,
        });
        return scoreA - scoreB;
      });
  }

  private async requireAssignableOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: { select: { id: true, latitude: true, longitude: true } },
        delivery: true,
      },
    });
    if (!order) throw new NotFoundException(`Order not found: ${orderId}`);
    if (order.deliveryMode === 'SELF') {
      throw new BadRequestException(
        'This store delivers its own orders — no platform rider can be assigned',
      );
    }
    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      throw new BadRequestException(
        `Order must be READY_FOR_PICKUP. Current: ${order.status}`,
      );
    }
    if (order.delivery && isActiveDeliveryStatus(order.delivery.status)) {
      throw new BadRequestException('Order already has an active delivery');
    }
    return order;
  }

  private async assertRiderEligible(riderProfileId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { store: { select: { storeZones: { select: { zoneId: true } } } } },
    });
    const storeZoneIds = order?.store?.storeZones.map((z) => z.zoneId) ?? [];

    const rider = await this.prisma.riderProfile.findUnique({
      where: { id: riderProfileId },
      include: {
        user: { select: { status: true, deletedAt: true } },
        zones: { select: { zoneId: true } },
        _count: {
          select: {
            deliveries: {
              where: {
                status: {
                  in: [
                    DeliveryStatus.ASSIGNED,
                    DeliveryStatus.ACCEPTED,
                    DeliveryStatus.PICKED_UP,
                    DeliveryStatus.ARRIVED_AT_STORE,
                  ],
                },
              },
            },
          },
        },
      },
    });

    if (!rider) throw new NotFoundException(`Rider not found: ${riderProfileId}`);
    if (rider.kycStatus !== KycStatus.APPROVED) {
      throw new BadRequestException('Rider KYC is not approved');
    }
    if (rider.status !== RiderStatus.ONLINE) {
      throw new BadRequestException('Rider must be ONLINE');
    }
    if (rider.user.status === UserStatus.SUSPENDED || rider.user.deletedAt) {
      throw new BadRequestException('Rider account is suspended or inactive');
    }
    if (rider.user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Rider account is not active');
    }
    if (rider.currentLat == null || rider.currentLng == null) {
      throw new BadRequestException('Rider location is required');
    }
    if (rider._count.deliveries >= MAX_ACTIVE_DELIVERIES) {
      throw new BadRequestException('Rider already has an active delivery');
    }
    const inZone = rider.zones.some((z) => storeZoneIds.includes(z.zoneId));
    if (storeZoneIds.length > 0 && !inZone) {
      throw new BadRequestException('Rider zone does not match store zone');
    }
  }

  private async upsertDelivery(order: any, riderProfileId: string, assignedBy: string) {
    const fulfillmentStoreId = await this.resolveFulfillmentStoreId(order.id, order.store?.id);
    const pickupStore = fulfillmentStoreId && fulfillmentStoreId !== order.store?.id
      ? await this.prisma.store.findUnique({
          where: { id: fulfillmentStoreId },
          select: { latitude: true, longitude: true },
        })
      : null;

    const storeLat = pickupStore?.latitude ?? order.store?.latitude ?? order.delivery?.pickupLat ?? null;
    const storeLng = pickupStore?.longitude ?? order.store?.longitude ?? order.delivery?.pickupLng ?? null;
    const deliveryLat = order.deliveryLat ?? order.delivery?.deliveryLat ?? null;
    const deliveryLng = order.deliveryLng ?? order.delivery?.deliveryLng ?? null;
    const distanceKm = safeDistanceKm(storeLat, storeLng, deliveryLat, deliveryLng);

    if (order.delivery) {
      // Generate handover codes only if this delivery record doesn't already have
      // them (idempotent across re-assignment so the merchant/buyer keep the same
      // code they were already shown).
      const otpPatch = {
        ...(order.delivery.pickupOtp ? {} : { pickupOtp: generateHandoverOtp() }),
        ...(order.delivery.deliveryOtp ? {} : { deliveryOtp: generateHandoverOtp() }),
      };
      return this.prisma.delivery.update({
        where: { id: order.delivery.id },
        data: {
          riderProfileId,
          status: DeliveryStatus.ASSIGNED,
          assignedAt: new Date(),
          assignedBy,
          fulfillmentStoreId: fulfillmentStoreId ?? order.store?.id,
          ...otpPatch,
          ...(distanceKm != null ? { distanceKm, estimatedMins: null } : {}),
          ...(storeLat != null ? { pickupLat: storeLat } : {}),
          ...(storeLng != null ? { pickupLng: storeLng } : {}),
        },
      });
    }

    return this.prisma.delivery.create({
      data: {
        orderId: order.id,
        riderProfileId,
        status: DeliveryStatus.ASSIGNED,
        fulfillmentStoreId: fulfillmentStoreId ?? order.store?.id,
        pickupLat: storeLat ?? 0,
        pickupLng: storeLng ?? 0,
        deliveryLat: deliveryLat ?? 0,
        deliveryLng: deliveryLng ?? 0,
        distanceKm,
        estimatedMins: null,
        assignedAt: new Date(),
        assignedBy,
        pickupOtp: generateHandoverOtp(),
        deliveryOtp: generateHandoverOtp(),
      },
    });
  }

  private async resolveFulfillmentStoreId(orderId: string, fallbackStoreId?: string): Promise<string | undefined> {
    const fo = await this.prisma.fulfillmentOrder.findFirst({
      where: { orderId },
      orderBy: { routingScore: 'asc' },
      select: { fulfillmentStoreId: true },
    });
    return fo?.fulfillmentStoreId ?? fallbackStoreId;
  }

  private async createAssignmentRecord(
    deliveryId: string,
    riderProfileId: string,
    assignedBy: string,
  ) {
    const expiresAt = new Date(Date.now() + this.autoAcceptSeconds * 1000);
    await this.prisma.deliveryAssignment.create({
      data: {
        deliveryId,
        riderProfileId,
        status: AssignmentStatus.OFFERED,
        expiresAt,
        assignedBy,
      },
    });
  }

  private async finishAssignment(input: {
    deliveryId: string;
    orderId: string;
    riderProfileId: string;
    orderNumber: string;
    actorId: string;
    ipAddress?: string;
    isReassignment: boolean;
    event: string;
  }) {
    await this.statusHistory.transition({
      orderId: input.orderId,
      toStatus: OrderStatus.RIDER_ASSIGNED,
      actorType: input.actorId === 'system' ? OrderActorType.SYSTEM : OrderActorType.ADMIN,
      actorId: input.actorId,
      note: input.isReassignment ? 'Rider reassigned' : 'Rider assigned',
      skipIfAlreadyStatus: false,
    });

    await this.prisma.riderProfile.update({
      where: { id: input.riderProfileId },
      data: { status: RiderStatus.BUSY },
    });

    await Promise.all([
      this.audit.log({
        actorId: input.actorId,
        action: input.isReassignment ? 'RIDER_REASSIGNED' : 'RIDER_ASSIGNED',
        resourceType: 'delivery',
        resourceId: input.deliveryId,
        ipAddress: input.ipAddress,
        metadata: {
          orderId: input.orderId,
          orderNumber: input.orderNumber,
          riderProfileId: input.riderProfileId,
        } as Prisma.InputJsonValue,
      }),
      this.domainEvents.emit(
        DomainEventType.RIDER_ASSIGNED,
        'delivery',
        input.deliveryId,
        {
          orderId: input.orderId,
          riderProfileId: input.riderProfileId,
          isReassignment: input.isReassignment,
        } as Prisma.InputJsonValue,
        { userId: input.actorId, ipAddress: input.ipAddress ?? null },
      ),
    ]);

    await this.cache.invalidateAssignmentCaches(input.orderId);
    if (!input.isReassignment) {
      void this.emailNotifications.sendBuyerDeliveryAssigned(input.orderId).catch(() => {});
      void this.buyerPush.notifyRiderAssigned(input.orderId).catch(() => {});
    }
    // The offer expires on a timer, so this must not be awaited into the
    // assignment path — a slow push endpoint would eat into the rider's window.
    void this.riderPush
      .notifyDeliveryOffered(input.riderProfileId, {
        orderId: input.orderId,
        isReassignment: input.isReassignment,
        expiresInSeconds: this.autoAcceptSeconds,
      })
      .catch(() => {});
    this.emitWs(input.event, {
      orderId: input.orderId,
      deliveryId: input.deliveryId,
      riderProfileId: input.riderProfileId,
    });
  }

  private emitWs(event: string, payload: Record<string, unknown>) {
    this.events.emit(`ws.${event}`, payload);
  }
}
