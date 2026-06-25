import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddressLabel, Prisma, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BuyerCacheService } from '../buyer/buyer-cache.service';
import { DeliveryTrackingService } from '../delivery-tracking/delivery-tracking.service';
import { RiderClusteringService } from '../fleet-os/rider-clustering.service';
import { BatchingService } from '../fleet-os/batching.service';
import { FleetAlertService } from '../fleet-os/fleet-alert.service';
import { HotspotService } from '../ai-commerce/hotspot.service';
import { unassignedOrderWhere } from '../rider-assignment/rider-assignment.util';
import {
  checkStoreDeliverability,
  estimateStoreToBuyerEta,
  normalizeDeliveryRadiusKm,
} from '../../common/utils/geospatial.util';
import {
  CheckDeliverabilityDto,
  CreateAddressDto,
  UpdateAddressDto,
  UpdateStoreRadiusDto,
} from './dto/geospatial.dto';

const STORE_GEO_INCLUDE = {
  city: { select: { id: true, name: true, slug: true } },
  storeServiceAreas: {
    include: {
      serviceArea: {
        select: { id: true, name: true, pincode: true, centerLat: true, centerLng: true, radiusKm: true },
      },
    },
  },
} satisfies Prisma.StoreInclude;

@Injectable()
export class GeospatialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly buyerCache: BuyerCacheService,
    private readonly tracking: DeliveryTrackingService,
    private readonly clusters: RiderClusteringService,
    private readonly batching: BatchingService,
    private readonly fleetAlerts: FleetAlertService,
    private readonly hotspots: HotspotService,
  ) {}

  async checkDeliverability(dto: CheckDeliverabilityDto) {
    const store = await this.prisma.store.findFirst({
      where: {
        id: dto.storeId,
        status: StoreStatus.APPROVED,
        isActive: true,
        deletedAt: null,
      },
      include: STORE_GEO_INCLUDE,
    });
    if (!store) throw new NotFoundException('Store not found');

    const result = checkStoreDeliverability(dto.lat, dto.lng, store);
    const etaMins = result.deliverable
      ? estimateStoreToBuyerEta(
          store.latitude,
          store.longitude,
          dto.lat,
          dto.lng,
          store.avgPrepTimeMins,
          result.effectiveRadiusKm,
        )
      : null;

    let nearestStores: Awaited<ReturnType<typeof this.findNearestStores>> = [];
    if (!result.deliverable) {
      nearestStores = await this.findNearestStores(dto.lat, dto.lng, 5, dto.storeId);
    }

    return {
      deliverable: result.deliverable,
      distanceKm: result.distanceKm,
      deliveryRadiusKm: result.effectiveRadiusKm,
      etaMins,
      reason: result.reason,
      nearestStores,
    };
  }

  async findNearestStores(lat: number, lng: number, limit = 5, excludeStoreId?: string) {
    const latDelta = 0.2;
    const lngDelta = 0.2;
    const stores = await this.prisma.store.findMany({
      where: {
        status: StoreStatus.APPROVED,
        isActive: true,
        deletedAt: null,
        ...(excludeStoreId && { id: { not: excludeStoreId } }),
        latitude: { gte: lat - latDelta, lte: lat + latDelta },
        longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
      },
      include: STORE_GEO_INCLUDE,
      take: 50,
    });

    return stores
      .map((store) => {
        const d = checkStoreDeliverability(lat, lng, store);
        if (!d.deliverable) return null;
        return {
          id: store.id,
          name: store.name,
          slug: store.slug,
          logoUrl: store.logoUrl,
          distanceKm: d.distanceKm,
          ratingAvg: store.ratingAvg,
          deliveryRadiusKm: d.effectiveRadiusKm,
          etaMins: estimateStoreToBuyerEta(
            store.latitude,
            store.longitude,
            lat,
            lng,
            store.avgPrepTimeMins,
            d.effectiveRadiusKm,
          ),
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      .slice(0, limit);
  }

  async getMapStores(lat: number, lng: number, radiusKm = 10) {
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
    const now = new Date();

    const stores = await this.prisma.store.findMany({
      where: {
        status: StoreStatus.APPROVED,
        isActive: true,
        deletedAt: null,
        latitude: { gte: lat - latDelta, lte: lat + latDelta },
        longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
      },
      include: {
        ...STORE_GEO_INCLUDE,
        storePromotions: {
          where: {
            isActive: true,
            pausedAt: null,
            startsAt: { lte: now },
            expiresAt: { gte: now },
          },
          take: 1,
          select: { id: true, name: true, offerType: true },
        },
        storeCategories: {
          take: 2,
          include: { category: { select: { name: true } } },
        },
      },
      take: 100,
    });

    return stores
      .map((store) => {
        const d = checkStoreDeliverability(lat, lng, store);
        if (!d.deliverable) return null;
        return {
          id: store.id,
          name: store.name,
          slug: store.slug,
          logoUrl: store.logoUrl,
          lat: store.latitude,
          lng: store.longitude,
          distanceKm: d.distanceKm,
          ratingAvg: store.ratingAvg,
          ratingCount: store.ratingCount,
          deliveryRadiusKm: d.effectiveRadiusKm,
          locality: store.locality,
          city: store.city.name,
          categories: store.storeCategories.map((sc) => sc.category.name),
          offer: store.storePromotions[0] ?? null,
          etaMins: estimateStoreToBuyerEta(
            store.latitude,
            store.longitude,
            lat,
            lng,
            store.avgPrepTimeMins,
            d.effectiveRadiusKm,
          ),
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }

  async validateCheckoutLocation(storeId: string, lat: number, lng: number): Promise<void> {
    const store = await this.prisma.store.findFirst({
      where: {
        id: storeId,
        status: StoreStatus.APPROVED,
        isActive: true,
        deletedAt: null,
      },
      include: { storeServiceAreas: { include: { serviceArea: true } } },
    });
    if (!store) throw new BadRequestException('Store is no longer accepting orders');

    const result = checkStoreDeliverability(lat, lng, store);
    if (!result.deliverable) {
      throw new BadRequestException({
        message: 'Store does not deliver to your location.',
        code: 'OUT_OF_DELIVERY_ZONE',
        nearestStores: await this.findNearestStores(lat, lng, 3, storeId),
      });
    }
  }

  async updateStoreRadius(adminUserId: string, storeId: string, dto: UpdateStoreRadiusDto) {
    const radius = normalizeDeliveryRadiusKm(dto.deliveryRadiusKm);
    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data: {
        deliveryRadiusKm: radius,
        ...(dto.locality !== undefined && { locality: dto.locality }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        deliveryRadiusKm: true,
        locality: true,
        latitude: true,
        longitude: true,
      },
    });
    await this.buyerCache.deleteByPattern('buyer:stores:*');
    await this.buyerCache.invalidate(`buyer:store:${updated.slug}`);
    return { ...updated, updatedBy: adminUserId };
  }

  async listAddresses(userId: string) {
    const bp = await this.requireBuyerProfile(userId);
    const rows = await this.prisma.address.findMany({
      where: { buyerProfileId: bp.id },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
    return rows.map((a) => this.serializeAddress(a));
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    const bp = await this.requireBuyerProfile(userId);
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { buyerProfileId: bp.id },
        data: { isDefault: false },
      });
    }
    const created = await this.prisma.address.create({
      data: {
        buyerProfileId: bp.id,
        label: dto.label ?? AddressLabel.HOME,
        line1: dto.line1,
        line2: dto.line2,
        landmark: dto.landmark,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        isDefault: dto.isDefault ?? false,
      },
    });
    return this.serializeAddress(created);
  }

  async updateAddress(userId: string, id: string, dto: UpdateAddressDto) {
    const bp = await this.requireBuyerProfile(userId);
    const existing = await this.prisma.address.findFirst({
      where: { id, buyerProfileId: bp.id },
    });
    if (!existing) throw new NotFoundException('Address not found');

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { buyerProfileId: bp.id },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.address.update({
      where: { id },
      data: {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.line1 !== undefined && { line1: dto.line1 }),
        ...(dto.line2 !== undefined && { line2: dto.line2 }),
        ...(dto.landmark !== undefined && { landmark: dto.landmark }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.pincode !== undefined && { pincode: dto.pincode }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });
    return this.serializeAddress(updated);
  }

  async deleteAddress(userId: string, id: string) {
    const bp = await this.requireBuyerProfile(userId);
    const existing = await this.prisma.address.findFirst({
      where: { id, buyerProfileId: bp.id },
    });
    if (!existing) throw new NotFoundException('Address not found');
    await this.prisma.address.delete({ where: { id } });
    return { deleted: true };
  }

  async getOperationsMap() {
    const [fleet, stores, zones, unassignedOrders, franchiseTerritories, riderClusters, demandHotspots, activeBatches, fleetAlerts] = await Promise.all([
      this.tracking.getFleetLive(),
      this.prisma.store.findMany({
        where: { status: StoreStatus.APPROVED, isActive: true, deletedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          latitude: true,
          longitude: true,
          deliveryRadiusKm: true,
          locality: true,
          city: { select: { name: true } },
        },
        take: 500,
      }),
      this.prisma.zone.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          centerLat: true,
          centerLng: true,
          radiusKm: true,
          city: { select: { name: true } },
        },
        take: 100,
      }),
      this.prisma.order.findMany({
        where: unassignedOrderWhere(),
        select: {
          id: true,
          orderNumber: true,
          deliveryLat: true,
          deliveryLng: true,
          store: { select: { id: true, name: true, latitude: true, longitude: true } },
        },
        take: 50,
      }),
      this.prisma.franchiseTerritory.findMany({
        where: { franchise: { status: 'ACTIVE' } },
        select: {
          id: true,
          city: true,
          state: true,
          pincodes: true,
          exclusivityEnabled: true,
          franchise: { select: { id: true, businessName: true } },
        },
        take: 100,
      }),
      this.clusters.listClusters(),
      this.hotspots.getHotspots(20),
      this.batching.listActiveBatches(),
      this.fleetAlerts.listOpenAlerts(),
    ]);

    return {
      fleet,
      stores: stores.map((s) => ({
        ...s,
        deliveryRadiusKm: normalizeDeliveryRadiusKm(s.deliveryRadiusKm),
      })),
      zones,
      franchiseTerritories: franchiseTerritories.map((t) => ({
        ...t,
        color: t.exclusivityEnabled ? '#8b5cf6' : '#6366f1',
      })),
      riderClusters: riderClusters.map((c) => ({
        ...c,
        color: c.demandSupplyRatio > 2 ? '#ef4444' : c.demandSupplyRatio > 1 ? '#f59e0b' : '#22c55e',
      })),
      demandHotspots: demandHotspots.map((h) => ({
        ...h,
        color: '#f97316',
      })),
      batchRoutes: activeBatches.map((b) => ({
        id: b.id,
        riderName: b.rider.name,
        status: b.status,
        orders: b.items.map((i) => i.order.orderNumber),
      })),
      fleetAlerts,
      unassignedOrders,
      activeDeliveries: fleet.riders
        .filter((r) => r.currentDelivery && r.location)
        .map((r) => ({
          riderId: r.id,
          riderName: r.name,
          order: r.currentDelivery,
          lat: r.location!.lat,
          lng: r.location!.lng,
        })),
      updatedAt: fleet.updatedAt,
    };
  }

  async getHotspotAnalytics() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: since },
        status: { in: ['DELIVERED', 'COMPLETED'] },
      },
      select: {
        deliveryLat: true,
        deliveryLng: true,
        totalAmount: true,
        createdAt: true,
        store: { select: { city: { select: { name: true } }, locality: true } },
      },
      take: 5000,
    });

    const localityMap = new Map<string, { count: number; revenue: number }>();
    const cityMap = new Map<string, number>();
    const hourMap = new Map<number, number>();

    for (const o of orders) {
      const locality = o.store.locality ?? 'Unknown';
      const city = o.store.city?.name ?? 'Unknown';
      const cur = localityMap.get(locality) ?? { count: 0, revenue: 0 };
      localityMap.set(locality, {
        count: cur.count + 1,
        revenue: cur.revenue + Number(o.totalAmount),
      });
      cityMap.set(city, (cityMap.get(city) ?? 0) + 1);
      hourMap.set(o.createdAt.getHours(), (hourMap.get(o.createdAt.getHours()) ?? 0) + 1);
    }

    return {
      totalDelivered: orders.length,
      topLocalities: [...localityMap.entries()]
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      topCities: [...cityMap.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      peakHours: [...hourMap.entries()]
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
      deliveryDensity: orders.length,
    };
  }

  async getMerchantAreaAnalytics(userId: string, storeId: string) {
    const store = await this.assertStoreOwned(userId, storeId);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const orders = await this.prisma.order.findMany({
      where: {
        storeId,
        createdAt: { gte: since },
        status: { in: ['DELIVERED', 'COMPLETED'] },
      },
      select: { deliveryLat: true, deliveryLng: true, totalAmount: true, buyerProfileId: true },
    });

    const grid = new Map<string, { count: number; revenue: number; buyers: Set<string> }>();
    for (const o of orders) {
      const key = `${o.deliveryLat.toFixed(2)},${o.deliveryLng.toFixed(2)}`;
      const cell = grid.get(key) ?? { count: 0, revenue: 0, buyers: new Set() };
      cell.count += 1;
      cell.revenue += Number(o.totalAmount);
      cell.buyers.add(o.buyerProfileId);
      grid.set(key, cell);
    }

    const buyerOrderCounts = new Map<string, number>();
    for (const o of orders) {
      buyerOrderCounts.set(o.buyerProfileId, (buyerOrderCounts.get(o.buyerProfileId) ?? 0) + 1);
    }

    const topAreas = [...grid.entries()]
      .map(([key, v]) => ({
        areaKey: key,
        orderCount: v.count,
        revenue: Math.round(v.revenue * 100) / 100,
        repeatBuyers: [...v.buyers].filter((id) => (buyerOrderCounts.get(id) ?? 0) > 1).length,
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 10);

    return {
      storeId: store.id,
      storeName: store.name,
      topDeliveryAreas: topAreas,
      totalOrders: orders.length,
    };
  }

  private serializeAddress(a: {
    id: string;
    label: AddressLabel;
    line1: string;
    line2: string | null;
    landmark: string | null;
    city: string;
    state: string;
    pincode: string;
    latitude: number;
    longitude: number;
    isDefault: boolean;
  }) {
    return {
      id: a.id,
      label: a.label,
      line1: a.line1,
      line2: a.line2,
      landmark: a.landmark,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      latitude: a.latitude,
      longitude: a.longitude,
      isDefault: a.isDefault,
    };
  }

  private async requireBuyerProfile(userId: string) {
    const bp = await this.prisma.buyerProfile.findUnique({ where: { userId } });
    if (!bp) throw new NotFoundException('Buyer profile not found');
    return bp;
  }

  private async assertStoreOwned(userId: string, storeId: string) {
    const profile = await this.prisma.merchantProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('Merchant profile not found');
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, merchantProfileId: profile.id, deletedAt: null },
    });
    if (!store) throw new ForbiddenException('Store not found');
    return store;
  }
}
