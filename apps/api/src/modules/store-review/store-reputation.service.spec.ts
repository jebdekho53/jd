import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, ReviewStatus } from '@prisma/client';
import { StoreReputationService } from './store-reputation.service';
import { PrismaService } from '../../database/prisma.service';
import { BuyerCacheService } from '../buyer/buyer-cache.service';

const mockPrisma = {
  review: {
    findMany: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
  },
  store: {
    update: jest.fn(),
    findUnique: jest.fn(),
  },
};

const mockCache = {
  invalidateStoreCache: jest.fn().mockResolvedValue(undefined),
};

describe('StoreReputationService', () => {
  let service: StoreReputationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreReputationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BuyerCacheService, useValue: mockCache },
      ],
    }).compile();
    service = module.get<StoreReputationService>(StoreReputationService);
    jest.clearAllMocks();
  });

  describe('isOrderReviewable', () => {
    it('allows DELIVERED and COMPLETED orders', () => {
      expect(service.isOrderReviewable(OrderStatus.DELIVERED)).toBe(true);
      expect(service.isOrderReviewable(OrderStatus.COMPLETED)).toBe(true);
      expect(service.isOrderReviewable(OrderStatus.CREATED)).toBe(false);
    });
  });

  describe('computeRankingScore', () => {
    it('scores higher-rated stores with more reviews above low-rated stores', () => {
      const high = service.computeRankingScore({
        averageRating: 4.8,
        totalReviews: 100,
        fulfillmentRate: 0.95,
        cancellationRate: 0.02,
        avgDeliveryMins: 25,
      });
      const low = service.computeRankingScore({
        averageRating: 2.5,
        totalReviews: 5,
        fulfillmentRate: 0.7,
        cancellationRate: 0.15,
        avgDeliveryMins: 45,
      });
      expect(high).toBeGreaterThan(low);
    });
  });

  describe('recomputeStoreReputation', () => {
    it('updates store rating aggregates from visible reviews', async () => {
      mockPrisma.review.findMany.mockResolvedValue([
        { rating: 5, merchantReply: 'Thanks!', buyerProfileId: 'bp-1' },
        { rating: 4, merchantReply: null, buyerProfileId: 'bp-1' },
        { rating: 3, merchantReply: null, buyerProfileId: 'bp-2' },
      ]);
      mockPrisma.order.findMany.mockResolvedValue([
        { status: OrderStatus.DELIVERED, delivery: { estimatedMins: 30 } },
        { status: OrderStatus.DELIVERED, delivery: { estimatedMins: 20 } },
      ]);
      mockPrisma.store.update.mockResolvedValue({ slug: 'test-store' });

      const result = await service.recomputeStoreReputation('store-1');

      expect(result.averageRating).toBe(4);
      expect(result.totalReviews).toBe(3);
      expect(result.distribution['5']).toBe(1);
      expect(result.distribution['4']).toBe(1);
      expect(result.distribution['3']).toBe(1);
      expect(result.repeatCustomers).toBe(1);
      expect(result.responseRate).toBeCloseTo(33.3, 0);
      expect(mockPrisma.store.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'store-1' },
          data: expect.objectContaining({
            ratingAvg: 4,
            ratingCount: 3,
          }),
        }),
      );
      expect(mockCache.invalidateStoreCache).toHaveBeenCalledWith('test-store');
    });

    it('filters only VISIBLE reviews', async () => {
      mockPrisma.review.findMany.mockResolvedValue([]);
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.store.update.mockResolvedValue({ slug: 'empty-store' });

      await service.recomputeStoreReputation('store-2');

      expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { storeId: 'store-2', status: ReviewStatus.VISIBLE },
        }),
      );
    });
  });
});
