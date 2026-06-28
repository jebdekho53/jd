import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, ReviewStatus } from '@prisma/client';
import { ProductReviewService } from './product-review.service';

const mockPrisma = {
  product: { findFirst: jest.fn() },
  buyerProfile: { findUnique: jest.fn() },
  productReview: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    create: jest.fn(),
  },
  orderItem: { findFirst: jest.fn() },
};

describe('ProductReviewService', () => {
  let service: ProductReviewService;

  beforeEach(() => {
    service = new ProductReviewService(mockPrisma as never);
    jest.clearAllMocks();
    mockPrisma.product.findFirst.mockResolvedValue({ id: 'p-1' });
    mockPrisma.buyerProfile.findUnique.mockResolvedValue({ id: 'bp-1' });
    mockPrisma.productReview.findUnique.mockResolvedValue(null);
    mockPrisma.productReview.aggregate.mockResolvedValue({
      _avg: { rating: 4.5 },
      _count: { id: 2 },
    });
    mockPrisma.productReview.findMany.mockResolvedValue([]);
    mockPrisma.productReview.count.mockResolvedValue(0);
    mockPrisma.orderItem.findFirst.mockResolvedValue({ id: 'oi-1', orderId: 'o-1' });
    mockPrisma.productReview.create.mockResolvedValue({
      id: 'r-1',
      productId: 'p-1',
      rating: 5,
      comment: 'Great',
      images: [],
      verifiedPurchase: true,
      createdAt: new Date('2026-01-01'),
      buyerProfile: { id: 'bp-1', name: 'Buyer' },
      order: { id: 'o-1', orderNumber: 'JD-1' },
    });
  });

  it('rejects review when buyer has no delivered order', async () => {
    mockPrisma.orderItem.findFirst.mockResolvedValueOnce(null);
    await expect(
      service.createProductReview('u-1', 'p-1', { rating: 5, comment: 'Nice' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects duplicate product review', async () => {
    mockPrisma.productReview.findUnique.mockResolvedValueOnce({ id: 'existing' });
    await expect(
      service.createProductReview('u-1', 'p-1', { rating: 4 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates verified purchase review for delivered order', async () => {
    const review = await service.createProductReview('u-1', 'p-1', {
      rating: 5,
      comment: 'Great',
    });
    expect(review.verifiedPurchase).toBe(true);
    expect(mockPrisma.productReview.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 'o-1',
          orderItemId: 'oi-1',
          status: ReviewStatus.VISIBLE,
        }),
      }),
    );
  });

  it('lists reviews with aggregate rating', async () => {
    mockPrisma.productReview.findMany.mockResolvedValue([
      {
        id: 'r-1',
        productId: 'p-1',
        rating: 5,
        comment: 'Good',
        images: [],
        verifiedPurchase: true,
        createdAt: new Date(),
        buyerProfile: { id: 'bp-1', name: 'A' },
        order: { id: 'o-1', orderNumber: 'JD-1' },
      },
    ]);
    mockPrisma.productReview.count.mockResolvedValue(1);

    const result = await service.listProductReviews('p-1', { page: 1, limit: 10 });
    expect(result.aggregate.ratingCount).toBe(2);
    expect(result.reviews).toHaveLength(1);
  });

  it('throws when product is missing', async () => {
    mockPrisma.product.findFirst.mockResolvedValueOnce(null);
    await expect(service.listProductReviews('missing', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects more than max review images', async () => {
    await expect(
      service.createProductReview('u-1', 'p-1', {
        rating: 5,
        images: Array.from({ length: 6 }, (_, i) => `https://cdn.example.com/${i}.jpg`),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
