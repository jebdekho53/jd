import { Injectable, NotFoundException } from '@nestjs/common';
import { StoreBusinessTypeStatus, StoreStatus, VerticalBusinessType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BUYER_HOME_VERTICALS, isFoodVertical } from './vertical.constants';
import { haversineKm } from '../../common/utils/delivery-eta.util';
import { canDeliverToBuyer, DEFAULT_BUYER_DISCOVERY_RADIUS_KM, toDeliverableStoreShape } from '../buyer/buyer-visibility.util';

@Injectable()
export class RestaurantDiscoveryService {
  constructor(private readonly prisma: PrismaService) {}

  getHomeVerticals() {
    return BUYER_HOME_VERTICALS;
  }

  async listRestaurants(opts: {
    lat?: number;
    lng?: number;
    cuisineSlug?: string;
    vertical?: VerticalBusinessType;
    page?: number;
    limit?: number;
  }) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const foodTypes = opts.vertical
      ? [opts.vertical]
      : ([
          VerticalBusinessType.RESTAURANT,
          VerticalBusinessType.CLOUD_KITCHEN,
          VerticalBusinessType.CAFE,
        ] as VerticalBusinessType[]);

    const stores = await this.prisma.store.findMany({
      where: {
        status: StoreStatus.APPROVED,
        isActive: true,
        deletedAt: null,
        businessTypes: {
          some: {
            businessType: { in: foodTypes },
            status: StoreBusinessTypeStatus.APPROVED,
          },
        },
        ...(opts.cuisineSlug
          ? {
              restaurantProfile: {
                cuisines: { some: { cuisine: { slug: opts.cuisineSlug } } },
              },
            }
          : {}),
      },
      include: {
        restaurantProfile: { include: { cuisines: { include: { cuisine: true } } } },
        businessTypes: { where: { status: StoreBusinessTypeStatus.APPROVED } },
        deliveryAreas: { where: { isActive: true } },
        storeServiceAreas: {
          include: {
            serviceArea: {
              select: { centerLat: true, centerLng: true, radiusKm: true },
            },
          },
        },
      },
      take: limit * 3,
      skip: (page - 1) * limit,
      orderBy: [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }],
    });

    let ranked = stores;
    if (opts.lat != null && opts.lng != null) {
      ranked = stores
        .map((s) => {
          const distanceKm =
            s.latitude != null && s.longitude != null
              ? Math.round(haversineKm(opts.lat!, opts.lng!, s.latitude, s.longitude) * 100) / 100
              : null;
          return { store: s, distanceKm };
        })
        .filter(({ store }) =>
          canDeliverToBuyer(toDeliverableStoreShape(store), {
            lat: opts.lat!,
            lng: opts.lng!,
            discoveryRadiusKm: DEFAULT_BUYER_DISCOVERY_RADIUS_KM,
          }).eligible,
        )
        .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
        .slice((page - 1) * limit, page * limit)
        .map(({ store, distanceKm }) => ({ ...store, distanceKm }));
    } else {
      ranked = stores.slice(0, limit);
    }

    return ranked.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      bannerUrl: s.bannerUrl,
      logoUrl: s.logoUrl,
      ratingAvg: s.ratingAvg,
      ratingCount: s.ratingCount,
      avgPrepTimeMins: s.restaurantProfile?.avgPrepTimeMins ?? s.avgPrepTimeMins,
      costForTwo: s.restaurantProfile?.costForTwo ? Number(s.restaurantProfile.costForTwo) : null,
      cuisines: s.restaurantProfile?.cuisines.map((c) => c.cuisine) ?? [],
      businessTypes: s.businessTypes.map((b) => b.businessType),
      isCloudKitchen: s.restaurantProfile?.isCloudKitchen ?? false,
      distanceKm: 'distanceKm' in s ? (s as { distanceKm?: number | null }).distanceKm ?? null : null,
    }));
  }

  async getRestaurantDetail(slug: string) {
    const store = await this.prisma.store.findFirst({
      where: { slug, isActive: true, deletedAt: null },
      include: {
        restaurantProfile: { include: { cuisines: { include: { cuisine: true } } } },
        businessTypes: { where: { status: StoreBusinessTypeStatus.APPROVED } },
        reviews: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!store) throw new NotFoundException('Restaurant not found');

    const hasFood = store.businessTypes.some((b) => isFoodVertical(b.businessType));
    if (!hasFood) throw new NotFoundException('Not a food restaurant');

    return {
      id: store.id,
      name: store.name,
      slug: store.slug,
      description: store.description,
      bannerUrl: store.bannerUrl,
      logoUrl: store.logoUrl,
      ratingAvg: store.ratingAvg,
      ratingCount: store.ratingCount,
      phone: store.phone,
      line1: store.line1,
      locality: store.locality,
      pincode: store.pincode,
      latitude: store.latitude,
      longitude: store.longitude,
      avgPrepTimeMins: store.restaurantProfile?.avgPrepTimeMins ?? store.avgPrepTimeMins,
      packagingFee: Number(store.restaurantProfile?.packagingFee ?? 0),
      minOrderAmount: Number(store.restaurantProfile?.minOrderAmount ?? store.minOrderAmount),
      costForTwo: store.restaurantProfile?.costForTwo ? Number(store.restaurantProfile.costForTwo) : null,
      cuisines: store.restaurantProfile?.cuisines.map((c) => c.cuisine) ?? [],
      reviews: store.reviews,
      acceptsScheduled: store.restaurantProfile?.acceptsScheduled ?? true,
    };
  }

  async listCuisines() {
    return this.prisma.cuisine.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
