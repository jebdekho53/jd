import { NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { WishlistService } from './wishlist.service';

describe('WishlistService', () => {
  let service: WishlistService;

  const prisma = {
    buyerProfile: { findUnique: jest.fn() },
    product: { findUnique: jest.fn() },
    wishlistItem: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    notification: { createMany: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.buyerProfile.findUnique.mockResolvedValue({ id: 'bp_1' });
    service = new WishlistService(prisma as never);
  });

  describe('list', () => {
    it('returns wishlist items mapped with product info', async () => {
      prisma.wishlistItem.findMany.mockResolvedValue([
        {
          id: 'w1',
          productId: 'p1',
          createdAt: new Date('2026-01-01'),
          product: {
            id: 'p1',
            name: 'Milk',
            unit: '1L',
            basePrice: 55,
            imageUrls: ['img1', 'img2'],
            store: { id: 's1', name: 'Store A', slug: 'store-a' },
          },
        },
      ]);

      const result = await service.list('user_1');

      expect(prisma.wishlistItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { buyerProfileId: 'bp_1' } }),
      );
      expect(result).toEqual([
        expect.objectContaining({
          id: 'w1',
          productId: 'p1',
          name: 'Milk',
          price: 55,
          imageUrl: 'img1',
          store: { id: 's1', name: 'Store A', slug: 'store-a' },
        }),
      ]);
    });

    it('throws when the buyer profile is missing', async () => {
      prisma.buyerProfile.findUnique.mockResolvedValue(null);
      await expect(service.list('user_x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('add', () => {
    it('upserts a wishlist item (idempotent for duplicate add)', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.wishlistItem.upsert.mockResolvedValue({});

      const result = await service.add('user_1', 'p1');

      expect(prisma.wishlistItem.upsert).toHaveBeenCalledWith({
        where: { buyerProfileId_productId: { buyerProfileId: 'bp_1', productId: 'p1' } },
        create: { buyerProfileId: 'bp_1', productId: 'p1' },
        update: {},
      });
      expect(result).toEqual({ productId: 'p1', wishlisted: true });
    });

    it('adding the same product twice stays a single upsert call each time (no duplicate row)', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.wishlistItem.upsert.mockResolvedValue({});

      await service.add('user_1', 'p1');
      await service.add('user_1', 'p1');

      // upsert with the compound unique key guarantees no duplicate rows.
      expect(prisma.wishlistItem.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.wishlistItem.upsert.mock.calls[0][0].update).toEqual({});
    });

    it('throws when the product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.add('user_1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.wishlistItem.upsert).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('removes an existing item', async () => {
      prisma.wishlistItem.deleteMany.mockResolvedValue({ count: 1 });
      const result = await service.remove('user_1', 'p1');
      expect(prisma.wishlistItem.deleteMany).toHaveBeenCalledWith({
        where: { buyerProfileId: 'bp_1', productId: 'p1' },
      });
      expect(result).toEqual({ productId: 'p1', wishlisted: false });
    });

    it('removing a non-existent item is a no-op (does not throw)', async () => {
      prisma.wishlistItem.deleteMany.mockResolvedValue({ count: 0 });
      await expect(service.remove('user_1', 'never')).resolves.toEqual({
        productId: 'never',
        wishlisted: false,
      });
    });
  });

  describe('onBackInStock', () => {
    it('creates a notification for every wishlister of the product', async () => {
      prisma.product.findUnique.mockResolvedValue({ name: 'Milk' });
      prisma.wishlistItem.findMany.mockResolvedValue([
        { buyerProfile: { userId: 'u1' } },
        { buyerProfile: { userId: 'u2' } },
        { buyerProfile: { userId: 'u3' } },
      ]);

      await service.onBackInStock({ productId: 'p1', variantId: 'v1' });

      expect(prisma.notification.createMany).toHaveBeenCalledTimes(1);
      const arg = prisma.notification.createMany.mock.calls[0][0];
      expect(arg.data).toHaveLength(3);
      expect(arg.data.map((d: { userId: string }) => d.userId)).toEqual(['u1', 'u2', 'u3']);
      expect(arg.data[0]).toEqual(
        expect.objectContaining({ type: NotificationType.INVENTORY_ALERT, title: 'Back in stock' }),
      );
    });

    it('does nothing when no one has wishlisted the product', async () => {
      prisma.product.findUnique.mockResolvedValue({ name: 'Milk' });
      prisma.wishlistItem.findMany.mockResolvedValue([]);

      await service.onBackInStock({ productId: 'p1', variantId: 'v1' });

      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });

    it('does nothing when the product no longer exists', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await service.onBackInStock({ productId: 'gone', variantId: 'v1' });

      expect(prisma.wishlistItem.findMany).not.toHaveBeenCalled();
      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });
  });
});
