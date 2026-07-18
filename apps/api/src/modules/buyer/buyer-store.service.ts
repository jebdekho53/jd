import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DayOfWeek, StoreDocumentType, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { normalizeDeliveryRadiusKm } from '../../common/utils/geospatial.util';
import { fetchStoreVisibleCategories, fetchStoresForCategory } from './buyer-category-catalog';
import { BuyerCacheService, BUYER_CACHE_KEYS } from './buyer-cache.service';
import { DeliveryEtaService } from './delivery-eta.service';
import { DiscoverStoresDto } from './dto/discover-stores.dto';
import {
  canDeliverToBuyer,
  resolveBuyerDeliveryTerms,
  STORE_DISCOVERY_INCLUDE,
  STORE_VISIBLE_WHERE,
} from './buyer-visibility.util';

// ── Types ──────────────────────────────────────────────────────────────────

export interface StoreCard {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  address: { line1: string; line2: string | null; pincode: string };
  ratingAvg: number;
  ratingCount: number;
  deliveryFee: number;
  minOrderAmount: number;
  avgPrepTimeMins: number;
  distanceKm: number;
  isOpen: boolean;
  todayHours: { openTime: string; closeTime: string } | null;
}

export interface StoreDetail extends StoreCard {
  phone: string | null;
  email: string | null;
  // Public storefront location — used for LocalBusiness GeoCoordinates /
  // PostalAddress on the SEO store page. Store geo is already public (map view).
  latitude: number;
  longitude: number;
  city: string | null;
  locality: string | null;
  storeType: string;
  hours: { day: string; openTime: string; closeTime: string; isClosed: boolean }[];
  serviceAreas: { id: string; name: string; pincode: string | null }[];
  categories: { id: string; name: string; slug: string }[];
  productCount: number;
  verifications: { gst: boolean; kyc: boolean; fssai: boolean };
  merchantSince: string;
  deliveryRadiusKm: number;
}

// ── IST helpers ──────────────────────────────────────────────────────────────

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

function nowIST(): Date {
  return new Date(Date.now() + IST_OFFSET_MS);
}

function dayOfWeekEnum(date: Date): DayOfWeek {
  const days: DayOfWeek[] = [
    DayOfWeek.SUNDAY,
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
  ];
  return days[date.getDay()];
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class BuyerStoreService {
  private readonly logger = new Logger(BuyerStoreService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: BuyerCacheService,
    private readonly deliveryEta: DeliveryEtaService,
  ) {}

  /**
   * Door-to-door delivery ETA from a store to a buyer coordinate, resolved at
   * checkout. Looks up the store's own location/prep time, then defers the
   * distance maths (Google routing with a road-adjusted fallback) to
   * {@link DeliveryEtaService}. Returns null ETA for an unknown/hidden store or
   * a destination beyond the store's delivery radius.
   */
  async getDeliveryEta(storeId: string, buyerLat: number, buyerLng: number) {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        avgPrepTimeMins: true,
        deliveryRadiusKm: true,
      },
    });
    if (!store) return { etaMinutes: null, distanceKm: null, source: 'unavailable' as const };

    const result = await this.deliveryEta.estimate({
      storeId: store.id,
      storeLat: store.latitude,
      storeLng: store.longitude,
      buyerLat,
      buyerLng,
      avgPrepTimeMins: store.avgPrepTimeMins ?? 15,
    });

    const radiusKm = normalizeDeliveryRadiusKm(store.deliveryRadiusKm);
    if (result.distanceKm != null && radiusKm != null && result.distanceKm > radiusKm) {
      return { etaMinutes: null, distanceKm: result.distanceKm, source: 'unavailable' as const };
    }
    return result;
  }

  // ── Discover stores near a coordinate ──────────────────────────────────────

  async discoverStores(
    dto: DiscoverStoresDto,
  ): Promise<{ stores: StoreCard[]; total: number }> {
    const { lat, lng, radiusKm = 5, page = 1, limit = 20, sort = 'distance', pincode } = dto;

    const cacheKey = BUYER_CACHE_KEYS.storeDiscovery(lat, lng, radiusKm, page, limit, sort, pincode);

    return this.cache.wrap(cacheKey, async () => {
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

      const visibleWhere = STORE_VISIBLE_WHERE;

      const storeInclude = STORE_DISCOVERY_INCLUDE;

      const pincodeQuery =
        pincode && /^\d{6}$/.test(pincode)
          ? this.prisma.store.findMany({
              where: {
                ...visibleWhere,
                deliveryAreas: { some: { pincode, isActive: true } },
              },
              include: storeInclude,
            })
          : Promise.resolve([]);

      const [byLocation, byServiceArea, byPincode] = await Promise.all([
        this.prisma.store.findMany({
          where: {
            ...visibleWhere,
            latitude: { gte: lat - latDelta, lte: lat + latDelta },
            longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
          },
          include: storeInclude,
        }),
        this.prisma.store.findMany({
          where: {
            ...visibleWhere,
            storeServiceAreas: {
              some: {
                serviceArea: {
                  centerLat: { gte: lat - latDelta, lte: lat + latDelta },
                  centerLng: { gte: lng - lngDelta, lte: lng + lngDelta },
                },
              },
            },
          },
          include: storeInclude,
        }),
        pincodeQuery,
      ]);

      const candidateMap = new Map<string, (typeof byLocation)[number]>();
      for (const store of [...byLocation, ...byServiceArea, ...byPincode]) {
        candidateMap.set(store.id, store);
      }

      const now = nowIST();
      const todayEnum = dayOfWeekEnum(now);
      const nowMins = now.getHours() * 60 + now.getMinutes();

      const enriched = [...candidateMap.values()]
        .map((store) => {
          const eligibility = canDeliverToBuyer(store, {
            lat,
            lng,
            pincode,
            discoveryRadiusKm: radiusKm,
          });
          if (!eligibility.eligible) return null;

          const terms = resolveBuyerDeliveryTerms(store, pincode);

          const todayHour = store.hours.find((h) => h.dayOfWeek === todayEnum) ?? null;
          const isOpen = computeIsOpen(todayHour, nowMins);

          const stats = store.reputationStats as { rankingScore?: number } | null;
          const reputationScore =
            stats?.rankingScore ??
            store.ratingAvg * Math.log10(store.ratingCount + 2);

          return {
            card: {
              id: store.id,
              name: store.name,
              slug: store.slug,
              logoUrl: store.logoUrl,
              bannerUrl: store.bannerUrl,
              description: store.description,
              address: { line1: store.line1, line2: store.line2, pincode: store.pincode },
              ratingAvg: store.ratingAvg,
              ratingCount: store.ratingCount,
              deliveryFee: terms.deliveryFee,
              minOrderAmount: terms.minOrderAmount,
              avgPrepTimeMins: terms.estimatedMinutes,
              distanceKm: eligibility.deliverable.distanceKm ?? 0,
              isOpen,
              todayHours: todayHour && !todayHour.isClosed
                ? { openTime: todayHour.openTime, closeTime: todayHour.closeTime }
                : null,
            } satisfies StoreCard,
            createdAt: store.createdAt,
            reputationScore,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);

      const sorted = sortStoreCards(enriched, sort);
      const total = sorted.length;
      const stores = sorted.slice((page - 1) * limit, page * limit).map((s) => s.card);

      this.logger.log(
        `discoverStores lat=${lat} lng=${lng} radiusKm=${radiusKm} → ${total} deliverable (${stores.length} on page ${page})`,
      );

      return { stores, total };
    });
  }

  async listStoresForCategory(
    categoryId: string,
    dto: DiscoverStoresDto & { subcategoryId?: string },
  ): Promise<{ stores: (StoreCard & { productCount: number })[]; total: number }> {
    const { lat, lng, radiusKm = 5, page = 1, limit = 20, subcategoryId, sort = 'distance', pincode } = dto;
    const storeCounts = await fetchStoresForCategory(this.prisma, categoryId, subcategoryId);

    this.logger.debug(
      `listStoresForCategory categoryId=${categoryId} pincode=${pincode ?? '—'} ` +
        `productStores=${storeCounts.length} [${storeCounts.map((s) => s.storeId).join(',')}]`,
    );

    if (storeCounts.length === 0) return { stores: [], total: 0 };

    const countMap = new Map<string, number>(
      storeCounts.map((s) => [s.storeId, s.productCount]),
    );

    const categoryStores = await this.prisma.store.findMany({
      where: {
        id: { in: [...countMap.keys()] },
        ...STORE_VISIBLE_WHERE,
      },
      include: STORE_DISCOVERY_INCLUDE,
    });

    const now = nowIST();
    const todayEnum = dayOfWeekEnum(now);
    const nowMins = now.getHours() * 60 + now.getMinutes();

    const enriched = categoryStores
      .map((store) => {
        const eligibility = canDeliverToBuyer(store, {
          lat,
          lng,
          pincode,
          discoveryRadiusKm: radiusKm,
        });

        this.logger.debug(
          `Store ${store.slug} | Distance ${eligibility.deliverable.distanceKm ?? '—'} km | ` +
            `Buyer pincode ${pincode ?? '—'} | Matched delivery area ${eligibility.pincodeMatch ? 'YES' : 'NO'} | ` +
            `Included ${eligibility.eligible ? 'YES' : 'NO'} | ` +
            `Reason ${eligibility.filterReason ?? 'ok'}`,
        );

        if (!eligibility.eligible) return null;

        const terms = resolveBuyerDeliveryTerms(store, pincode);

        const todayHour = store.hours.find((h) => h.dayOfWeek === todayEnum) ?? null;
        const isOpen = computeIsOpen(todayHour, nowMins);
        const stats = store.reputationStats as { rankingScore?: number } | null;
        const reputationScore =
          stats?.rankingScore ?? store.ratingAvg * Math.log10(store.ratingCount + 2);

        return {
          card: {
            id: store.id,
            name: store.name,
            slug: store.slug,
            logoUrl: store.logoUrl,
            bannerUrl: store.bannerUrl,
            description: store.description,
            address: { line1: store.line1, line2: store.line2, pincode: store.pincode },
            ratingAvg: store.ratingAvg,
            ratingCount: store.ratingCount,
            deliveryFee: terms.deliveryFee,
            minOrderAmount: terms.minOrderAmount,
            avgPrepTimeMins: terms.estimatedMinutes,
            distanceKm: eligibility.deliverable.distanceKm ?? 0,
            isOpen,
            todayHours: todayHour && !todayHour.isClosed
              ? { openTime: todayHour.openTime, closeTime: todayHour.closeTime }
              : null,
            productCount: countMap.get(store.id) ?? 0,
          } as StoreCard & { productCount: number },
          createdAt: store.createdAt,
          reputationScore,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    const sorted = sortStoreCards(enriched, sort);
    const total = sorted.length;
    const stores: (StoreCard & { productCount: number })[] = sorted
      .slice((page - 1) * limit, page * limit)
      .map((s) => s.card);

    this.logger.log(
      `listStoresForCategory categoryId=${categoryId} subcategoryId=${subcategoryId ?? '—'} → ${total} deliverable (${stores.length} on page ${page})`,
    );

    return { stores, total };
  }

  // ── Store detail by slug ────────────────────────────────────────────────────

  async getStoreBySlug(slug: string): Promise<StoreDetail> {
    const cacheKey = BUYER_CACHE_KEYS.storeDetail(slug);

    return this.cache.wrap(cacheKey, async () => {
      const store = await this.prisma.store.findFirst({
        where: {
          slug,
          status: StoreStatus.APPROVED,
          isActive: true,
          deletedAt: null,
        },
        include: {
          hours: { orderBy: { dayOfWeek: 'asc' } },
          city: { select: { name: true } },
          storeServiceAreas: {
            include: {
              serviceArea: { select: { id: true, name: true, pincode: true, radiusKm: true } },
            },
          },
          verificationDocuments: { select: { documentType: true } },
          merchantProfile: {
            select: { kycStatus: true, gstNumber: true, createdAt: true },
          },
          _count: {
            select: {
              products: {
                where: { isActive: true, deletedAt: null },
              },
            },
          },
        },
      });

      if (!store) throw new NotFoundException(`Store not found: ${slug}`);

      const storeCategories = await fetchStoreVisibleCategories(this.prisma, store.id);
      const categoryRows = storeCategories.flatMap((parent) =>
        parent.children.length > 0
          ? parent.children.map((ch) => ({ id: ch.id, name: ch.name, slug: ch.slug }))
          : [{ id: parent.id, name: parent.name, slug: parent.slug }],
      );

      const docTypes = new Set(store.verificationDocuments.map((d) => d.documentType));
      const deliveryRadiusKm = normalizeDeliveryRadiusKm(store.deliveryRadiusKm);

      const now = nowIST();
      const todayEnum = dayOfWeekEnum(now);
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const todayHour = store.hours.find((h) => h.dayOfWeek === todayEnum) ?? null;
      const isOpen = computeIsOpen(todayHour, nowMins);

      return {
        id: store.id,
        name: store.name,
        slug: store.slug,
        logoUrl: store.logoUrl,
        bannerUrl: store.bannerUrl,
        description: store.description,
        phone: store.phone,
        email: store.email,
        latitude: store.latitude,
        longitude: store.longitude,
        city: store.city?.name ?? null,
        locality: store.locality,
        storeType: store.storeType,
        address: { line1: store.line1, line2: store.line2, pincode: store.pincode },
        ratingAvg: store.ratingAvg,
        ratingCount: store.ratingCount,
        deliveryFee: Number(store.deliveryFee),
        minOrderAmount: Number(store.minOrderAmount),
        avgPrepTimeMins: store.avgPrepTimeMins,
        distanceKm: 0, // caller should compute from their location; returned as 0 here
        isOpen,
        todayHours: todayHour && !todayHour.isClosed
          ? { openTime: todayHour.openTime, closeTime: todayHour.closeTime }
          : null,
        hours: store.hours.map((h) => ({
          day: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          isClosed: h.isClosed,
        })),
        serviceAreas: store.storeServiceAreas.map((ssa) => ({
          id: ssa.serviceArea.id,
          name: ssa.serviceArea.name,
          pincode: ssa.serviceArea.pincode,
        })),
        categories: categoryRows,
        productCount: store._count.products,
        verifications: {
          gst: Boolean(store.merchantProfile.gstNumber) || docTypes.has(StoreDocumentType.GST_CERTIFICATE),
          kyc: store.merchantProfile.kycStatus === 'APPROVED',
          fssai: docTypes.has(StoreDocumentType.FSSAI_LICENSE),
        },
        merchantSince: store.merchantProfile.createdAt.toISOString(),
        deliveryRadiusKm,
      } satisfies StoreDetail;
    });
  }
}

function computeIsOpen(
  hour: { isClosed: boolean; openTime: string; closeTime: string } | null,
  nowMins: number,
): boolean {
  if (!hour || hour.isClosed) return false;
  const open = timeToMinutes(hour.openTime);
  const close = timeToMinutes(hour.closeTime);

  // Handle overnight hours (e.g. 22:00 – 02:00)
  if (close < open) {
    return nowMins >= open || nowMins < close;
  }
  return nowMins >= open && nowMins < close;
}

function sortStoreCards<T extends StoreCard>(
  stores: { card: T; createdAt: Date; reputationScore: number }[],
  sort: string,
): { card: T; createdAt: Date; reputationScore: number }[] {
  const copy = [...stores];
  switch (sort) {
    case 'popular':
      return copy.sort((a, b) => b.reputationScore - a.reputationScore);
    case 'fast':
      return copy.sort((a, b) => a.card.avgPrepTimeMins - b.card.avgPrepTimeMins);
    case 'rating':
      return copy.sort(
        (a, b) =>
          b.card.ratingAvg - a.card.ratingAvg || b.card.ratingCount - a.card.ratingCount,
      );
    case 'new':
      return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    case 'distance':
    default:
      return copy.sort((a, b) => a.card.distanceKm - b.card.distanceKm);
  }
}
