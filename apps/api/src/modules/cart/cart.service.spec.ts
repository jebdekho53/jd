import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { StoreStatus } from '@prisma/client';
import { CartService } from './cart.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { CartCacheService } from './cart-cache.service';
import { StorePromotionService } from '../promotion/store-promotion.service';
import { MembershipBenefitService } from '../membership/membership-benefit.service';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BUYER_PROFILE = { id: 'bp-1', userId: 'u-1' };
const STORE = {
  id: 's-1',
  name: 'Test Store',
  slug: 'test-store',
  deliveryFee: 20,
  minOrderAmount: 50,
  status: StoreStatus.APPROVED,
  isActive: true,
  deletedAt: null,
};
const VARIANT = {
  id: 'v-1',
  name: 'Default',
  sku: 'SKU-001',
  price: 49,
  mrp: 59,
  weightGrams: null,
  inventory: { availableQty: 10, reservedQty: 0 },
  product: {
    id: 'p-1',
    name: 'Amul Milk',
    slug: 'amul-milk',
    imageUrls: [],
    isVeg: true,
    storeId: 's-1',
  },
};
const CART = { id: 'cart-1', buyerProfileId: 'bp-1', storeId: 's-1' };
const CART_ITEM = {
  id: 'ci-1',
  cartId: 'cart-1',
  productId: 'p-1',
  variantId: 'v-1',
  quantity: 2,
  cart: { buyerProfileId: 'bp-1' },
};

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPrisma = {
  buyerProfile: { findUnique: jest.fn(), create: jest.fn() },
  cart: { findFirst: jest.fn(), upsert: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
  cartItem: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  productVariant: { findFirst: jest.fn() },
  store: { findFirst: jest.fn(), findUnique: jest.fn() },
  $transaction: jest.fn(),
};
const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };
const mockEvents = { emit: jest.fn().mockResolvedValue('e-1') };
const mockPromotions = {
  applyPromoToCart: jest.fn().mockResolvedValue(undefined),
  recalculateCartTotals: jest.fn(),
};
const mockMembership = {
  applyBenefitsToCart: jest.fn().mockResolvedValue(undefined),
};
const mockCartCache = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  invalidate: jest.fn().mockResolvedValue(undefined),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CartService', () => {
  let service: CartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: DomainEventsService, useValue: mockEvents },
        { provide: CartCacheService, useValue: mockCartCache },
        { provide: StorePromotionService, useValue: mockPromotions },
        { provide: MembershipBenefitService, useValue: mockMembership },
      ],
    }).compile();
    service = module.get<CartService>(CartService);
    jest.clearAllMocks();
    mockAudit.log.mockResolvedValue(undefined);
    mockEvents.emit.mockResolvedValue('e-1');
    mockCartCache.get.mockResolvedValue(null);
    mockCartCache.set.mockResolvedValue(undefined);
    mockCartCache.invalidate.mockResolvedValue(undefined);
  });

  // ── getCart ─────────────────────────────────────────────────────────────

  describe('getCart', () => {
    it('returns null when buyer has no cart', async () => {
      mockPrisma.buyerProfile.findUnique.mockResolvedValue(BUYER_PROFILE);
      mockPrisma.cart.findFirst.mockResolvedValue(null);

      const result = await service.getCart('u-1');
      expect(result).toBeNull();
    });

    it('returns cached cart if present', async () => {
      mockPrisma.buyerProfile.findUnique.mockResolvedValue(BUYER_PROFILE);
      const fakeCart = { id: 'cart-1', items: [], totals: {} };
      mockCartCache.get.mockResolvedValue(fakeCart);

      const result = await service.getCart('u-1');
      expect(result).toEqual(fakeCart);
      expect(mockPrisma.cart.findFirst).not.toHaveBeenCalled();
    });
  });

  // ── addItem ─────────────────────────────────────────────────────────────

  describe('addItem', () => {
    beforeEach(() => {
      mockPrisma.buyerProfile.findUnique.mockResolvedValue(BUYER_PROFILE);
      mockPrisma.productVariant.findFirst.mockResolvedValue(VARIANT);
      mockPrisma.store.findFirst.mockResolvedValue(STORE);
    });

    it('throws ConflictException when product is out of stock', async () => {
      mockPrisma.productVariant.findFirst.mockResolvedValue({
        ...VARIANT,
        inventory: { availableQty: 0, reservedQty: 0, status: 'ACTIVE' },
      });

      await expect(
        service.addItem('u-1', { productId: 'p-1', variantId: 'v-1', quantity: 1 }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when cart belongs to different store', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue({ ...CART, storeId: 's-OTHER' });
      mockPrisma.store.findUnique.mockResolvedValue({ name: 'Other Store' });

      await expect(
        service.addItem('u-1', { productId: 'p-1', variantId: 'v-1', quantity: 1 }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates new cart when none exists', async () => {
      mockPrisma.cart.findFirst
        .mockResolvedValueOnce(null)      // ownership check
        .mockResolvedValueOnce(null);      // loadCartFromDb
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.cart.upsert.mockResolvedValue(CART);
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);
      mockPrisma.cartItem.create.mockResolvedValue(CART_ITEM);

      // loadCartFromDb will return null (simplify test)
      const cartViewSpy = jest
        .spyOn(service as any, 'loadCartFromDb')
        .mockResolvedValue({ id: 'cart-1', items: [], totals: {} } as any);

      await service.addItem('u-1', { productId: 'p-1', variantId: 'v-1', quantity: 1 });

      expect(mockPrisma.cart.upsert).toHaveBeenCalled();
      expect(mockPrisma.cartItem.create).toHaveBeenCalled();
      cartViewSpy.mockRestore();
    });

    it('throws ConflictException when requested qty exceeds available stock', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue(CART); // same store
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.cart.upsert.mockResolvedValue(CART);
      mockPrisma.cartItem.findUnique.mockResolvedValue({ quantity: 8 }); // already 8 in cart

      await expect(
        service.addItem('u-1', { productId: 'p-1', variantId: 'v-1', quantity: 5 }), // 8+5 > 10
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── updateItem ──────────────────────────────────────────────────────────

  describe('updateItem', () => {
    beforeEach(() => {
      mockPrisma.buyerProfile.findUnique.mockResolvedValue(BUYER_PROFILE);
      mockPrisma.cartItem.findUnique.mockResolvedValue(CART_ITEM);
      mockPrisma.productVariant.findFirst.mockResolvedValue(VARIANT);
      mockPrisma.store.findFirst.mockResolvedValue(STORE);
    });

    it('throws ForbiddenException when cart item belongs to another buyer', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue({
        ...CART_ITEM,
        cart: { buyerProfileId: 'bp-ANOTHER' },
      });

      await expect(
        service.updateItem('u-1', 'ci-1', { quantity: 3 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException when new qty exceeds available stock', async () => {
      await expect(
        service.updateItem('u-1', 'ci-1', { quantity: 99 }),
      ).rejects.toThrow(ConflictException);
    });

    it('delegates to removeItemById when quantity is 0', async () => {
      const removeSpy = jest
        .spyOn(service as any, 'removeItemById')
        .mockResolvedValue(null);

      await service.updateItem('u-1', 'ci-1', { quantity: 0 });
      expect(removeSpy).toHaveBeenCalled();
      removeSpy.mockRestore();
    });
  });

  // ── clearCart ───────────────────────────────────────────────────────────

  describe('clearCart', () => {
    it('is a no-op when no cart exists', async () => {
      mockPrisma.buyerProfile.findUnique.mockResolvedValue(BUYER_PROFILE);
      mockPrisma.cart.findFirst.mockResolvedValue(null);

      await expect(service.clearCart('u-1')).resolves.toBeUndefined();
    });

    it('deletes cart and items, invalidates cache', async () => {
      mockPrisma.buyerProfile.findUnique.mockResolvedValue(BUYER_PROFILE);
      mockPrisma.cart.findFirst.mockResolvedValue(CART);
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      await service.clearCart('u-1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockCartCache.invalidate).toHaveBeenCalledWith('bp-1');
    });
  });
});
