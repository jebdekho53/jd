import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import {
  DeliveryStatus,
  OrderStatus,
  Prisma,
  RiderStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  computeDeliveryEta,
  safeDistanceKm,
} from '../../common/utils/delivery-eta.util';
import type { RequestUser } from '../../common/types';
import { OrderCacheService } from '../order/order-cache.service';
import { labelForNormalizedStatus } from '../logistics/mappers/normalized-status-labels';
import { unassignedOrderWhere } from '../rider-assignment/rider-assignment.util';
import { UpdateRiderLocationDto } from '../rider/dto/update-rider-location.dto';
import { DeliveryTrackingCacheService } from './delivery-tracking-cache.service';
import { TRACKING_EVENTS } from './delivery-tracking.events';

const ACTIVE_DELIVERY_STATUSES: DeliveryStatus[] = [
  DeliveryStatus.ASSIGNED,
  DeliveryStatus.ACCEPTED,
  DeliveryStatus.ARRIVED_AT_STORE,
  DeliveryStatus.PICKED_UP,
  DeliveryStatus.IN_TRANSIT,
  DeliveryStatus.ARRIVED_AT_CUSTOMER,
];

const TRACKABLE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.RIDER_ASSIGNED,
  OrderStatus.PICKED_UP,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

export interface LiveTrackingView {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  deliveryStatus: string;
  store: { lat: number; lng: number; name: string };
  customer: { lat: number; lng: number; address: Record<string, unknown> };
  rider: {
    id: string;
    name: string;
    lat: number | null;
    lng: number | null;
    heading: number | null;
    speed: number | null;
    lastLocationAt: string | null;
    vehicleType: string | null;
  } | null;
  route: Array<{ lat: number; lng: number; recordedAt: string }>;
  eta: {
    estimatedMins: number | null;
    estimatedArrivalAt: string | null;
    etaAvailable: boolean;
    distanceKm: number | null;
    riderDistanceFromStoreKm: number | null;
    riderDistanceToCustomerKm: number | null;
  };
  trackingActive: boolean;
  progressStage: string;
  updatedAt: string;
  provider?: {
    type: string;
    name: string;
    trackingNumber: string | null;
    normalizedStatus: string;
    normalizedStatusLabel?: string;
    badgeLabel?: string;
    driverName?: string | null;
    driverPhone?: string | null;
    vehicleType?: string | null;
  };
  providerTimeline?: Array<{
    status: string;
    label: string;
    description?: string | null;
    occurredAt: string;
  }>;
  hasLiveProviderLocation?: boolean;
}

@Injectable()
export class DeliveryTrackingService {
  private readonly logger = new Logger(DeliveryTrackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly trackingCache: DeliveryTrackingCacheService,
    private readonly orderCache: OrderCacheService,
  ) {}

  async processRiderLocation(riderProfileId: string, dto: UpdateRiderLocationDto): Promise<void> {
    const rider = await this.prisma.riderProfile.findUnique({
      where: { id: riderProfileId },
      select: { status: true, user: { select: { status: true } } },
    });
    if (!rider) return;

    if (rider.status === RiderStatus.OFFLINE || rider.user.status === 'SUSPENDED') {
      return;
    }

    const activeDelivery = await this.prisma.delivery.findFirst({
      where: {
        riderProfileId,
        status: { in: ACTIVE_DELIVERY_STATUSES },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            storeId: true,
            deliveryLat: true,
            deliveryLng: true,
            deliveryAddress: true,
            store: { select: { latitude: true, longitude: true, name: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!activeDelivery) return;

    const now = new Date();
    await this.prisma.deliveryTracking.create({
      data: {
        deliveryId: activeDelivery.id,
        riderProfileId,
        lat: dto.latitude,
        lng: dto.longitude,
        heading: dto.heading,
        speed: dto.speed,
        accuracy: dto.accuracy,
        recordedAt: now,
      },
    });

    const eta = await this.recalculateEta(activeDelivery, dto.latitude, dto.longitude, now);

    await this.trackingCache.invalidateTracking(activeDelivery.orderId);
    await this.trackingCache.invalidateFleet();
    await this.orderCache.invalidate(activeDelivery.orderId);
    await this.orderCache.invalidateAll(activeDelivery.orderId);

    const payload = {
      orderId: activeDelivery.orderId,
      orderNumber: activeDelivery.order.orderNumber,
      storeId: activeDelivery.order.storeId,
      riderProfileId,
      lat: dto.latitude,
      lng: dto.longitude,
      heading: dto.heading ?? null,
      speed: dto.speed ?? null,
      deliveryStatus: activeDelivery.status,
      orderStatus: activeDelivery.order.status,
      ...eta,
    };

    this.events.emit(`ws.${TRACKING_EVENTS.LOCATION_UPDATED}`, payload);
    if (eta.estimatedMins != null) {
      this.events.emit(`ws.${TRACKING_EVENTS.ETA_UPDATED}`, payload);
    }
  }

  private async recalculateEta(
    delivery: {
      id: string;
      status: DeliveryStatus;
      pickedUpAt: Date | null;
      order: {
        status: OrderStatus;
        deliveryLat: number;
        deliveryLng: number;
        store: { latitude: number; longitude: number };
      };
    },
    riderLat: number,
    riderLng: number,
    now: Date,
  ) {
    const etaResult = computeDeliveryEta({
      orderStatus: delivery.order.status,
      deliveryStatus: delivery.status,
      storeLat: delivery.order.store.latitude,
      storeLng: delivery.order.store.longitude,
      customerLat: delivery.order.deliveryLat,
      customerLng: delivery.order.deliveryLng,
      riderLat,
      riderLng,
      pickedUpAt: delivery.pickedUpAt,
      hasActiveAssignment: true,
    });

    let estimatedArrivalAt: Date | null = null;
    if (etaResult.estimatedMins != null) {
      estimatedArrivalAt = new Date(now.getTime() + etaResult.estimatedMins * 60_000);
    }

    await this.prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        estimatedMins: etaResult.estimatedMins,
        estimatedArrivalAt,
      },
    });

    return {
      estimatedMins: etaResult.estimatedMins,
      estimatedArrivalAt: estimatedArrivalAt?.toISOString() ?? null,
      etaAvailable: etaResult.etaAvailable,
    };
  }

  async getBuyerTracking(userId: string, orderId: string): Promise<LiveTrackingView> {
    const bp = await this.prisma.buyerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!bp) throw new NotFoundException('Buyer profile not found');

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, buyerProfileId: bp.id },
      select: this.orderTrackingSelect(),
    });
    if (!order) throw new NotFoundException('Order not found');

    return this.buildTrackingView(order);
  }

  async getMerchantTracking(userId: string, orderId: string): Promise<LiveTrackingView> {
    const stores = await this.prisma.store.findMany({
      where: { merchantProfile: { userId } },
      select: { id: true },
    });
    const storeIds = stores.map((s) => s.id);
    if (storeIds.length === 0) throw new ForbiddenException('No stores');

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, storeId: { in: storeIds } },
      select: this.orderTrackingSelect(),
    });
    if (!order) throw new NotFoundException('Order not found');

    return this.buildTrackingView(order);
  }

  async getAdminTracking(orderId: string): Promise<LiveTrackingView> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: this.orderTrackingSelect(),
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.buildTrackingView(order);
  }

  async getFleetLive(statusFilter?: string) {
    const riderWhere: Prisma.RiderProfileWhereInput = {};
    if (statusFilter === 'ONLINE') {
      riderWhere.status = { in: [RiderStatus.ONLINE, RiderStatus.BUSY] };
    } else if (statusFilter === 'BUSY') {
      riderWhere.status = { in: [RiderStatus.BUSY, RiderStatus.ON_DELIVERY] };
    } else if (statusFilter === 'OFFLINE') {
      riderWhere.status = RiderStatus.OFFLINE;
    }

    const riders = await this.prisma.riderProfile.findMany({
      where: riderWhere,
      select: {
        id: true,
        name: true,
        status: true,
        vehicleType: true,
        currentLat: true,
        currentLng: true,
        currentHeading: true,
        currentSpeed: true,
        lastLocationAt: true,
        zones: { select: { zone: { select: { name: true } } }, take: 1 },
        deliveries: {
          where: { status: { in: ACTIVE_DELIVERY_STATUSES } },
          take: 1,
          select: {
            id: true,
            status: true,
            estimatedMins: true,
            estimatedArrivalAt: true,
            order: { select: { id: true, orderNumber: true, status: true, storeId: true } },
          },
        },
        user: { select: { phone: true, status: true } },
      },
      take: 200,
    });

    const unassigned = await this.prisma.order.count({
      where: unassignedOrderWhere(),
    });

    const activeOrders = await this.prisma.order.count({
      where: { status: { in: TRACKABLE_ORDER_STATUSES } },
    });

    return {
      riders: riders.map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.user.phone,
        status: r.user.status === 'SUSPENDED' ? 'SUSPENDED' : r.status,
        vehicleType: r.vehicleType,
        zone: r.zones[0]?.zone.name ?? null,
        location:
          r.currentLat != null && r.currentLng != null
            ? {
                lat: r.currentLat,
                lng: r.currentLng,
                heading: r.currentHeading,
                speed: r.currentSpeed,
                lastLocationAt: r.lastLocationAt?.toISOString() ?? null,
              }
            : null,
        currentDelivery: r.deliveries[0]
          ? {
              orderId: r.deliveries[0].order.id,
              orderNumber: r.deliveries[0].order.orderNumber,
              status: r.deliveries[0].status,
              etaMins: r.deliveries[0].estimatedMins,
            }
          : null,
      })),
      stats: {
        onlineRiders: riders.filter((r) => r.status === RiderStatus.ONLINE).length,
        busyRiders: riders.filter((r) =>
          (r.status === RiderStatus.BUSY || r.status === RiderStatus.ON_DELIVERY),
        ).length,
        offlineRiders: riders.filter((r) => r.status === RiderStatus.OFFLINE).length,
        activeOrders,
        unassignedOrders: unassigned,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  async getAnalytics() {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const deliveries = await this.prisma.delivery.findMany({
      where: {
        deliveredAt: { gte: since },
        status: DeliveryStatus.DELIVERED,
      },
      select: {
        estimatedMins: true,
        assignedAt: true,
        deliveredAt: true,
        riderProfileId: true,
      },
    });

    const etas = deliveries
      .map((d) => d.estimatedMins)
      .filter((m): m is number => m != null);
    const avgEta = etas.length ? Math.round(etas.reduce((a, b) => a + b, 0) / etas.length) : 0;

    const durations = deliveries
      .filter((d) => d.assignedAt && d.deliveredAt)
      .map((d) => (d.deliveredAt!.getTime() - d.assignedAt!.getTime()) / 60_000);
    const avgDeliveryMins = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    const late = deliveries.filter((d) => {
      if (!d.estimatedMins || !d.assignedAt || !d.deliveredAt) return false;
      const actual = (d.deliveredAt.getTime() - d.assignedAt.getTime()) / 60_000;
      return actual > d.estimatedMins + 10;
    }).length;

    const riderCounts = await this.prisma.riderProfile.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const perRider = await this.prisma.delivery.groupBy({
      by: ['riderProfileId'],
      where: { deliveredAt: { gte: since }, status: DeliveryStatus.DELIVERED },
      _count: { id: true },
    });

    return {
      avgEtaMins: avgEta,
      avgDeliveryTimeMins: avgDeliveryMins,
      lateDeliveries: late,
      onlineRiders:
        riderCounts.find((r) => r.status === RiderStatus.ONLINE)?._count.id ?? 0,
      busyRiders:
        (riderCounts.find((r) => r.status === RiderStatus.BUSY)?._count.id ?? 0) +
        (riderCounts.find((r) => r.status === RiderStatus.ON_DELIVERY)?._count.id ?? 0),
      deliveriesPerRider: perRider.map((r) => ({
        riderProfileId: r.riderProfileId,
        count: r._count.id,
      })),
    };
  }

  emitDeliveryEvent(
    event: 'STARTED' | 'ARRIVED' | 'COMPLETED',
    payload: {
      orderId: string;
      orderNumber?: string;
      storeId?: string;
      riderProfileId?: string;
      deliveryStatus?: string;
      orderStatus?: string;
    },
  ) {
    const map = {
      STARTED: TRACKING_EVENTS.STARTED,
      ARRIVED: TRACKING_EVENTS.ARRIVED,
      COMPLETED: TRACKING_EVENTS.COMPLETED,
    } as const;
    this.events.emit(`ws.${map[event]}`, payload);
  }

  emitOrderStatus(payload: {
    orderId: string;
    orderNumber: string;
    storeId: string;
    riderProfileId?: string;
    orderStatus: string;
    deliveryStatus?: string;
  }) {
    void this.trackingCache.invalidateTracking(payload.orderId);
    void this.orderCache.invalidateAll(payload.orderId);
    this.events.emit(`ws.${TRACKING_EVENTS.ORDER_STATUS}`, payload);
  }

  private orderTrackingSelect() {
    return {
      id: true,
      orderNumber: true,
      status: true,
      storeId: true,
      deliveryLat: true,
      deliveryLng: true,
      deliveryAddress: true,
      store: { select: { name: true, latitude: true, longitude: true } },
      delivery: {
        select: {
          id: true,
          status: true,
          pickedUpAt: true,
          estimatedMins: true,
          estimatedArrivalAt: true,
          distanceKm: true,
          riderProfile: {
            select: {
              id: true,
              name: true,
              vehicleType: true,
              currentLat: true,
              currentLng: true,
              currentHeading: true,
              currentSpeed: true,
              lastLocationAt: true,
            },
          },
        },
      },
      providerShipment: {
        select: {
          id: true,
          providerType: true,
          trackingNumber: true,
          normalizedStatus: true,
          driverName: true,
          driverPhone: true,
          vehicleType: true,
          estimatedEtaMins: true,
          estimatedArrivalAt: true,
          provider: { select: { name: true } },
          events: {
            orderBy: { occurredAt: 'asc' },
            take: 100,
            select: {
              lat: true,
              lng: true,
              occurredAt: true,
              normalizedStatus: true,
              description: true,
              providerStatus: true,
            },
          },
        },
      },
    } satisfies Prisma.OrderSelect;
  }

  private async buildTrackingView(order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    storeId: string;
    deliveryLat: number;
    deliveryLng: number;
    deliveryAddress: unknown;
    store: { name: string; latitude: number; longitude: number };
    delivery: {
      id: string;
      status: DeliveryStatus;
      pickedUpAt: Date | null;
      estimatedMins: number | null;
      estimatedArrivalAt: Date | null;
      distanceKm: number | null;
      riderProfile: {
        id: string;
        name: string;
        vehicleType: string;
        currentLat: number | null;
        currentLng: number | null;
        currentHeading: number | null;
        currentSpeed: number | null;
        lastLocationAt: Date | null;
      } | null;
    } | null;
    providerShipment?: {
      id: string;
      providerType: string;
      trackingNumber: string | null;
      normalizedStatus: string;
      driverName: string | null;
      driverPhone: string | null;
      vehicleType: string | null;
      estimatedEtaMins: number | null;
      estimatedArrivalAt: Date | null;
      provider: { name: string };
      events: Array<{
        lat: number | null;
        lng: number | null;
        occurredAt: Date;
        normalizedStatus: string;
        description: string | null;
        providerStatus: string | null;
      }>;
    } | null;
  }): Promise<LiveTrackingView> {
    const cached = await this.trackingCache.getTracking<LiveTrackingView>(order.id);
    if (cached) return cached;

    const hasProvider = Boolean(order.providerShipment);
    const trackable =
      TRACKABLE_ORDER_STATUSES.includes(order.status) &&
      Boolean(order.delivery) &&
      (Boolean(order.delivery?.riderProfile) || hasProvider);
    if (!trackable || !order.delivery) {
      throw new ForbiddenException('Live tracking not available for this order');
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const points = await this.prisma.deliveryTracking.findMany({
      where: { deliveryId: order.delivery.id, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'asc' },
      take: 500,
      select: { lat: true, lng: true, recordedAt: true },
    });

    const providerEvents = order.providerShipment?.events ?? [];
    const providerRoute = providerEvents
      .filter((e) => e.lat != null && e.lng != null)
      .map((e) => ({
        lat: e.lat!,
        lng: e.lng!,
        recordedAt: e.occurredAt.toISOString(),
      }));

    const rider = order.delivery.riderProfile;
    const provider = order.providerShipment;
    const latestProviderLoc = [...providerEvents].reverse().find((e) => e.lat != null && e.lng != null);

    const syntheticRider =
      !rider && provider?.driverName
        ? {
            id: `provider:${provider.id}`,
            name: provider.driverName,
            lat: latestProviderLoc?.lat ?? null,
            lng: latestProviderLoc?.lng ?? null,
            heading: null,
            speed: null,
            lastLocationAt: latestProviderLoc?.occurredAt.toISOString() ?? null,
            vehicleType: provider.vehicleType,
          }
        : rider
          ? {
              id: rider.id,
              name: rider.name,
              lat: rider.currentLat,
              lng: rider.currentLng,
              heading: rider.currentHeading,
              speed: rider.currentSpeed,
              lastLocationAt: rider.lastLocationAt?.toISOString() ?? null,
              vehicleType: rider.vehicleType,
            }
          : null;

    const etaResult = computeDeliveryEta({
      orderStatus: order.status,
      deliveryStatus: order.delivery.status,
      storeLat: order.store.latitude,
      storeLng: order.store.longitude,
      customerLat: order.deliveryLat,
      customerLng: order.deliveryLng,
      riderLat: syntheticRider?.lat ?? undefined,
      riderLng: syntheticRider?.lng ?? undefined,
      pickedUpAt: order.delivery.pickedUpAt,
      hasActiveAssignment: Boolean(syntheticRider),
    });

    const riderDistanceFromStoreKm =
      syntheticRider?.lat != null && syntheticRider?.lng != null
        ? safeDistanceKm(syntheticRider.lat, syntheticRider.lng, order.store.latitude, order.store.longitude)
        : null;

    const riderDistanceToCustomerKm =
      syntheticRider?.lat != null && syntheticRider?.lng != null
        ? safeDistanceKm(syntheticRider.lat, syntheticRider.lng, order.deliveryLat, order.deliveryLng)
        : null;

    const view: LiveTrackingView = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      deliveryStatus: order.delivery.status,
      store: {
        lat: order.store.latitude,
        lng: order.store.longitude,
        name: order.store.name,
      },
      customer: {
        lat: order.deliveryLat,
        lng: order.deliveryLng,
        address: order.deliveryAddress as Record<string, unknown>,
      },
      rider: syntheticRider,
      route:
        points.length > 0
          ? points.map((p) => ({
              lat: p.lat,
              lng: p.lng,
              recordedAt: p.recordedAt.toISOString(),
            }))
          : providerRoute,
      eta: {
        estimatedMins:
          order.delivery.estimatedMins ??
          provider?.estimatedEtaMins ??
          etaResult.estimatedMins,
        estimatedArrivalAt:
          order.delivery.estimatedArrivalAt?.toISOString() ??
          provider?.estimatedArrivalAt?.toISOString() ??
          null,
        etaAvailable: etaResult.etaAvailable,
        distanceKm: order.delivery.distanceKm,
        riderDistanceFromStoreKm,
        riderDistanceToCustomerKm,
      },
      trackingActive: trackable && order.status !== OrderStatus.DELIVERED,
      progressStage: this.resolveProgressStage(order.status, order.delivery.status),
      updatedAt: new Date().toISOString(),
      ...(provider
        ? {
            provider: {
              type: provider.providerType,
              name: provider.provider.name,
              trackingNumber: provider.trackingNumber,
              normalizedStatus: provider.normalizedStatus,
              normalizedStatusLabel: labelForNormalizedStatus(provider.normalizedStatus),
              badgeLabel: `Delivered by ${provider.provider.name}`,
              driverName: provider.driverName,
              driverPhone: provider.driverPhone,
              vehicleType: provider.vehicleType,
            },
            providerTimeline: providerEvents.map((e) => ({
              status: e.normalizedStatus,
              label: labelForNormalizedStatus(e.normalizedStatus),
              description: e.description ?? e.providerStatus,
              occurredAt: e.occurredAt.toISOString(),
            })),
            hasLiveProviderLocation: Boolean(latestProviderLoc),
          }
        : {}),
    };

    await this.trackingCache.setTracking(order.id, view);
    return view;
  }

  private resolveProgressStage(orderStatus: OrderStatus, deliveryStatus: DeliveryStatus): string {
    if (orderStatus === OrderStatus.DELIVERED || deliveryStatus === DeliveryStatus.DELIVERED) {
      return 'delivered';
    }
    if (
      deliveryStatus === DeliveryStatus.ARRIVED_AT_CUSTOMER ||
      orderStatus === OrderStatus.OUT_FOR_DELIVERY
    ) {
      return 'arriving';
    }
    if (
      deliveryStatus === DeliveryStatus.PICKED_UP ||
      deliveryStatus === DeliveryStatus.IN_TRANSIT ||
      orderStatus === OrderStatus.PICKED_UP
    ) {
      return 'out_for_delivery';
    }
    if (deliveryStatus === DeliveryStatus.ARRIVED_AT_STORE) {
      return 'at_store';
    }
    if (orderStatus === OrderStatus.RIDER_ASSIGNED) {
      return 'rider_to_store';
    }
    return 'waiting';
  }

  @Cron('0 3 * * *')
  async pruneTrackingPoints(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.prisma.deliveryTracking.deleteMany({
      where: { recordedAt: { lt: cutoff } },
    });
    if (result.count > 0) {
      this.logger.log(`Pruned ${result.count} delivery tracking points older than 24h`);
    }
  }

  @Cron('0 4 * * 0')
  async summarizeOldRoutes(): Promise<void> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const deliveries = await this.prisma.delivery.findMany({
      where: { deliveredAt: { lt: weekAgo, not: null } },
      select: { id: true },
      take: 100,
    });
    for (const d of deliveries) {
      const count = await this.prisma.deliveryTracking.count({ where: { deliveryId: d.id } });
      if (count > 1) {
        const last = await this.prisma.deliveryTracking.findFirst({
          where: { deliveryId: d.id },
          orderBy: { recordedAt: 'desc' },
        });
        if (last) {
          await this.prisma.deliveryTracking.deleteMany({
            where: { deliveryId: d.id, id: { not: last.id } },
          });
        }
      }
    }
  }
}
