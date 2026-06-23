import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DayOfWeek, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BuyerCacheService, BUYER_CACHE_KEYS } from './buyer-cache.service';
import { DiscoverStoresDto } from './dto/discover-stores.dto';

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
  hours: { day: string; openTime: string; closeTime: string; isClosed: boolean }[];
  serviceAreas: { id: string; name: string; pincode: string | null }[];
  categories: { id: string; name: string; slug: string }[];
  productCount: number;
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

// ── Haversine ────────────────────────────────────────────────────────────────

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class BuyerStoreService {
  private readonly logger = new Logger(BuyerStoreService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: BuyerCacheService,
  ) {}

  // ── Discover stores near a coordinate ──────────────────────────────────────

  async discoverStores(
    dto: DiscoverStoresDto,
  ): Promise<{ stores: StoreCard[]; total: number }> {
    const { lat, lng, radiusKm = 5, page = 1, limit = 20 } = dto;

    const cacheKey = BUYER_CACHE_KEYS.storeDiscovery(lat, lng, radiusKm, page, limit);

    return this.cache.wrap(cacheKey, async () => {
      // Bounding-box pre-filter (1° lat ≈ 111 km, 1° lng ≈ 111 km at equator)
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

      const candidates = await this.prisma.store.findMany({
        where: {
          status: StoreStatus.APPROVED,
          isActive: true,
          deletedAt: null,
          latitude: { gte: lat - latDelta, lte: lat + latDelta },
          longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
        },
        include: {
          hours: true,
          storeServiceAreas: {
            include: {
              serviceArea: {
                select: { centerLat: true, centerLng: true, radiusKm: true },
              },
            },
          },
        },
      });

      const now = nowIST();
      const todayEnum = dayOfWeekEnum(now);
      const nowMins = now.getHours() * 60 + now.getMinutes();

      const enriched = candidates
        .map((store) => {
          const distanceKm = haversineKm(lat, lng, store.latitude, store.longitude);
          if (distanceKm > radiusKm) return null;

          // Service-area check: if the store has declared service areas, the
          // buyer must be within at least one. Stores with no configured service
          // areas are shown unconditionally (they are newly onboarded).
          if (store.storeServiceAreas.length > 0) {
            const inServiceArea = store.storeServiceAreas.some(({ serviceArea: sa }) => {
              const d = haversineKm(lat, lng, sa.centerLat, sa.centerLng);
              return d <= sa.radiusKm;
            });
            if (!inServiceArea) return null;
          }

          const todayHour = store.hours.find((h) => h.dayOfWeek === todayEnum) ?? null;
          const isOpen = computeIsOpen(todayHour, nowMins);

          return {
            id: store.id,
            name: store.name,
            slug: store.slug,
            logoUrl: store.logoUrl,
            bannerUrl: store.bannerUrl,
            description: store.description,
            address: { line1: store.line1, line2: store.line2, pincode: store.pincode },
            ratingAvg: store.ratingAvg,
            ratingCount: store.ratingCount,
            deliveryFee: Number(store.deliveryFee),
            minOrderAmount: Number(store.minOrderAmount),
            avgPrepTimeMins: store.avgPrepTimeMins,
            distanceKm: Math.round(distanceKm * 100) / 100,
            isOpen,
            todayHours: todayHour && !todayHour.isClosed
              ? { openTime: todayHour.openTime, closeTime: todayHour.closeTime }
              : null,
          } satisfies StoreCard;
        })
        .filter((s): s is StoreCard => s !== null)
        .sort((a, b) => a.distanceKm - b.distanceKm);

      const total = enriched.length;
      const stores = enriched.slice((page - 1) * limit, page * limit);

      return { stores, total };
    });
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
          storeServiceAreas: {
            include: {
              serviceArea: { select: { id: true, name: true, pincode: true } },
            },
          },
          categories: {
            where: { isActive: true },
            select: { id: true, name: true, slug: true },
            orderBy: { sortOrder: 'asc' },
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
        categories: store.categories,
        productCount: store._count.products,
      } satisfies StoreDetail;
    });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
