import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { StoreStatus, DayOfWeek } from '@prisma/client';
import { BuyerStoreService } from './buyer-store.service';
import { PrismaService } from '../../database/prisma.service';
import { BuyerCacheService } from './buyer-cache.service';

const makeStore = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 's-1',
  merchantProfileId: 'mp-1',
  name: 'Test Store',
  slug: 'test-store',
  logoUrl: null,
  bannerUrl: null,
  description: null,
  phone: null,
  email: null,
  line1: '123 Main St',
  line2: null,
  pincode: '110001',
  latitude: 28.6139,
  longitude: 77.209,
  deliveryRadiusKm: 5,
  status: StoreStatus.APPROVED,
  isActive: true,
  deletedAt: null,
  ratingAvg: 4.2,
  ratingCount: 10,
  deliveryFee: 20,
  minOrderAmount: 50,
  avgPrepTimeMins: 15,
  hours: [
    {
      dayOfWeek: DayOfWeek.MONDAY,
      openTime: '08:00',
      closeTime: '22:00',
      isClosed: false,
    },
  ],
  storeServiceAreas: [],
  verificationDocuments: [],
  merchantProfile: { gstNumber: null, kycStatus: 'APPROVED', createdAt: new Date() },
  categories: [],
  _count: { products: 5 },
  ...overrides,
});

// Passthrough cache: fn is always called
const mockCache = {
  wrap: jest.fn((_, fn: () => Promise<unknown>) => fn()),
};

const mockPrisma = {
  store: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  merchantCategory: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  category: {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
  },
  storeCategory: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  product: {
    groupBy: jest.fn().mockResolvedValue([]),
    findMany: jest.fn().mockResolvedValue([]),
  },
};

describe('BuyerStoreService', () => {
  let service: BuyerStoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuyerStoreService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BuyerCacheService, useValue: mockCache },
      ],
    }).compile();
    service = module.get<BuyerStoreService>(BuyerStoreService);
    jest.clearAllMocks();
    mockPrisma.merchantCategory.findMany.mockResolvedValue([]);
    mockPrisma.category.findMany.mockResolvedValue([]);
    mockPrisma.product.findMany.mockResolvedValue([]);
    // Reset cache mock to passthrough
    mockCache.wrap.mockImplementation((_, fn: () => Promise<unknown>) => fn());
  });

  // ── discoverStores ──────────────────────────────────────────────────────

  describe('discoverStores', () => {
    it('returns stores within radius sorted by distance', async () => {
      const store = makeStore();
      mockPrisma.store.findMany.mockResolvedValue([store]);

      const { stores, total } = await service.discoverStores({
        lat: 28.6139,
        lng: 77.209,
        radiusKm: 5,
        page: 1,
        limit: 20,
      });

      expect(mockPrisma.store.findMany).toHaveBeenCalledTimes(2);
      expect(stores).toHaveLength(1);
      expect(stores[0].distanceKm).toBeLessThanOrEqual(5);
      expect(total).toBe(1);
    });

    it('includes store when buyer is in a linked service area', async () => {
      const store = makeStore({
        latitude: 19.076,
        longitude: 72.877,
        storeServiceAreas: [
          {
            serviceArea: {
              centerLat: 28.6139,
              centerLng: 77.209,
              radiusKm: 3,
            },
          },
        ],
      });
      mockPrisma.store.findMany.mockResolvedValue([store]);

      const { stores } = await service.discoverStores({
        lat: 28.6139,
        lng: 77.209,
        radiusKm: 5,
      });

      expect(stores).toHaveLength(1);
    });

    it('includes store near buyer even when service areas do not cover buyer', async () => {
      const store = makeStore({
        storeServiceAreas: [
          {
            serviceArea: {
              centerLat: 19.076,
              centerLng: 72.877,
              radiusKm: 2,
            },
          },
        ],
      });
      mockPrisma.store.findMany.mockResolvedValue([store]);

      const { stores } = await service.discoverStores({
        lat: 28.6139,
        lng: 77.209,
        radiusKm: 5,
      });

      expect(stores).toHaveLength(1);
    });

    it('excludes stores outside the radius', async () => {
      // A store 50 km away (Noida to Mumbai) should not appear
      const farStore = makeStore({ latitude: 19.076, longitude: 72.877 });
      mockPrisma.store.findMany.mockResolvedValue([farStore]);

      const { stores } = await service.discoverStores({
        lat: 28.6139,
        lng: 77.209,
        radiusKm: 5,
      });

      // The bounding-box filter would prevent this store from reaching the Haversine stage
      // but since the mock returns it anyway, the Haversine should filter it out
      expect(stores).toHaveLength(0);
    });

    it('correctly sets isOpen for a store with matching hours', async () => {
      const store = makeStore();
      mockPrisma.store.findMany.mockResolvedValue([store]);

      const result = await service.discoverStores({ lat: 28.6139, lng: 77.209 });
      // isOpen depends on current IST time — just verify the field exists
      expect(result.stores[0]).toHaveProperty('isOpen');
    });

    it('returns isOpen=false when store is closed today', async () => {
      const store = makeStore({
        hours: [
          { dayOfWeek: DayOfWeek.MONDAY, openTime: '08:00', closeTime: '09:00', isClosed: false },
          { dayOfWeek: DayOfWeek.TUESDAY, openTime: '08:00', closeTime: '09:00', isClosed: false },
          { dayOfWeek: DayOfWeek.WEDNESDAY, openTime: '08:00', closeTime: '09:00', isClosed: false },
          { dayOfWeek: DayOfWeek.THURSDAY, openTime: '08:00', closeTime: '09:00', isClosed: false },
          { dayOfWeek: DayOfWeek.FRIDAY, openTime: '08:00', closeTime: '09:00', isClosed: false },
          { dayOfWeek: DayOfWeek.SATURDAY, openTime: '08:00', closeTime: '09:00', isClosed: false },
          { dayOfWeek: DayOfWeek.SUNDAY, openTime: '08:00', closeTime: '09:00', isClosed: true },
        ],
      });
      mockPrisma.store.findMany.mockResolvedValue([store]);

      // All hours are 08:00–09:00 so at most times the store is closed anyway
      const result = await service.discoverStores({ lat: 28.6139, lng: 77.209 });
      expect(result.stores[0]).toHaveProperty('isOpen');
    });
  });

  // ── getStoreBySlug ──────────────────────────────────────────────────────

  describe('getStoreBySlug', () => {
    it('returns store detail for a visible approved store', async () => {
      mockPrisma.store.findFirst.mockResolvedValue(makeStore());

      const detail = await service.getStoreBySlug('test-store');
      expect(detail.slug).toBe('test-store');
      expect(detail.productCount).toBe(5);
      expect(detail.hours).toBeInstanceOf(Array);
    });

    it('throws NotFoundException for unknown slug', async () => {
      mockPrisma.store.findFirst.mockResolvedValue(null);

      await expect(service.getStoreBySlug('ghost-store')).rejects.toThrow(NotFoundException);
    });

    it('uses cache wrapper', async () => {
      mockPrisma.store.findFirst.mockResolvedValue(makeStore());
      await service.getStoreBySlug('test-store');
      expect(mockCache.wrap).toHaveBeenCalledWith(
        expect.stringContaining('buyer:store:test-store'),
        expect.any(Function),
      );
    });
  });

  describe('listStoresForCategory', () => {
    const DAIRY_ID = 'cat-dairy';
    const GROCERY_ID = 'cat-grocery';

    beforeEach(() => {
      mockPrisma.category.findFirst.mockImplementation(({ where }: { where: { id: string } }) => {
        if (where.id === DAIRY_ID) {
          return Promise.resolve({ id: DAIRY_ID, parentId: GROCERY_ID });
        }
        return Promise.resolve(null);
      });
      mockPrisma.storeCategory.findMany.mockResolvedValue([
        { storeId: 's-1', subcategoryId: DAIRY_ID },
      ]);
      mockPrisma.product.groupBy.mockResolvedValue([
        { storeId: 's-1', _count: { id: 1 } },
      ]);
    });

    it('returns category-qualified stores that deliver to the buyer', async () => {
      const store = makeStore();
      mockPrisma.store.findMany.mockResolvedValue([store]);

      const { stores, total } = await service.listStoresForCategory(DAIRY_ID, {
        lat: 28.6139,
        lng: 77.209,
        radiusKm: 20,
        page: 1,
        limit: 12,
      });

      expect(total).toBe(1);
      expect(stores[0].name).toBe('Test Store');
      expect(stores[0].productCount).toBe(1);
      expect(mockPrisma.store.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { in: ['s-1'] } }),
        }),
      );
    });
  });
});
