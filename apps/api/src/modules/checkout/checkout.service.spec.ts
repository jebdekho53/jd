import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CheckoutStatus, PaymentMethod, StoreStatus } from '@prisma/client';
import { CheckoutService } from './checkout.service';
import { PrismaService } from '../../database/prisma.service';
import { CartService } from '../cart/cart.service';
import { ReservationService } from './reservation.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';

const CHECKOUT_ID = 'chk_test_001';
const ORDER_ID = 'ord_test_001';
const USER_ID = 'user_test_001';
const STORE_ID = 'store_test_001';
const BUYER_PROFILE_ID = 'bp_test_001';

const mockCart = {
  id: 'cart1',
  storeId: STORE_ID,
  items: [
    {
      productId: 'p1',
      variantId: 'v1',
      quantity: 2,
      unitPrice: 100,
      product: { name: 'Apple' },
      variant: { name: '1kg', sku: 'APL-1KG' },
    },
  ],
  totals: { subtotal: 200, discount: 0, deliveryFee: 20, tax: 0, grandTotal: 220 },
};

const mockDeliveryAddress = {
  line1: '42 MG Road',
  city: 'Delhi',
  pincode: '110001',
  lat: 28.61,
  lng: 77.21,
};

const mockPrisma = {
  $transaction: jest.fn(),
  buyerProfile: { findUnique: jest.fn() },
  checkout: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  store: { findFirst: jest.fn() },
  productVariant: { findFirst: jest.fn() },
  order: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  orderStatusHistory: { create: jest.fn() },
};

const mockCartService = {
  getCart: jest.fn(),
  clearCart: jest.fn(),
};
const mockReservation = {
  reserveInventory: jest.fn(),
  consumeReservations: jest.fn(),
  releaseReservations: jest.fn(),
};
const mockAudit = { log: jest.fn() };
const mockDomainEvents = { emit: jest.fn() };

describe('CheckoutService', () => {
  let service: CheckoutService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CartService, useValue: mockCartService },
        { provide: ReservationService, useValue: mockReservation },
        { provide: AuditService, useValue: mockAudit },
        { provide: DomainEventsService, useValue: mockDomainEvents },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
    jest.clearAllMocks();
  });

  describe('initiateCheckout', () => {
    beforeEach(() => {
      mockCartService.getCart.mockResolvedValue(mockCart);
      mockPrisma.buyerProfile.findUnique.mockResolvedValue({ id: BUYER_PROFILE_ID });
      mockPrisma.store.findFirst.mockResolvedValue({
        id: STORE_ID,
        status: StoreStatus.APPROVED,
        isActive: true,
        latitude: 28.6139,
        longitude: 77.209,
        storeServiceAreas: [],
      });
      mockPrisma.productVariant.findFirst.mockResolvedValue({
        id: 'v1',
        isActive: true,
        inventory: { quantity: 10, reserved: 0 },
      });
      mockPrisma.checkout.create.mockResolvedValue({
        id: CHECKOUT_ID,
        buyerProfileId: BUYER_PROFILE_ID,
        storeId: STORE_ID,
        status: CheckoutStatus.INITIATED,
        totalAmount: 220,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });
      mockReservation.reserveInventory.mockResolvedValue(undefined);
      const mockTx = {
        checkout: {
          create: jest.fn().mockResolvedValue({
            id: CHECKOUT_ID,
            buyerProfileId: BUYER_PROFILE_ID,
            storeId: STORE_ID,
            status: CheckoutStatus.INITIATED,
            totalAmount: 220,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          }),
        },
        order: {
          create: jest.fn().mockResolvedValue({ id: ORDER_ID, orderNumber: 'JD-20260622-ABC123', status: 'PAYMENT_PENDING', items: [] }),
          findUnique: jest.fn().mockResolvedValue(null),
        },
        orderStatusHistory: { create: jest.fn() },
      };
      mockPrisma.$transaction.mockImplementation(async (cb: Function) => {
        if (typeof cb === 'function') return cb(mockTx);
        return Promise.all(cb);
      });
      mockPrisma.checkout.update.mockResolvedValue({
        id: CHECKOUT_ID,
        status: CheckoutStatus.RESERVED,
        totalAmount: 220,
        orderId: ORDER_ID,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });
      mockCartService.clearCart.mockResolvedValue(undefined);
      mockAudit.log.mockResolvedValue(undefined);
      mockDomainEvents.emit.mockResolvedValue(undefined);
    });

    it('throws BadRequestException when cart is empty', async () => {
      mockCartService.getCart.mockResolvedValue(null);
      await expect(
        service.initiateCheckout(USER_ID, { deliveryAddress: mockDeliveryAddress }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when buyer profile not found', async () => {
      mockPrisma.buyerProfile.findUnique.mockResolvedValue(null);
      await expect(
        service.initiateCheckout(USER_ID, { deliveryAddress: mockDeliveryAddress }),
      ).rejects.toThrow(BadRequestException);
    });

    it('expires checkout and re-throws when reservation fails', async () => {
      mockReservation.reserveInventory.mockRejectedValue(new BadRequestException('Out of stock'));
      await expect(
        service.initiateCheckout(USER_ID, { deliveryAddress: mockDeliveryAddress }),
      ).rejects.toThrow('Out of stock');

      expect(mockPrisma.checkout.update).toHaveBeenCalledWith({
        where: { id: CHECKOUT_ID },
        data: { status: CheckoutStatus.EXPIRED },
      });
    });

    it('clears cart after successful checkout', async () => {
      await service.initiateCheckout(USER_ID, { deliveryAddress: mockDeliveryAddress });
      expect(mockCartService.clearCart).toHaveBeenCalledWith(USER_ID);
    });
  });

  describe('getCheckout', () => {
    it('returns checkout for the owner', async () => {
      mockPrisma.buyerProfile.findUnique.mockResolvedValue({ id: BUYER_PROFILE_ID });
      mockPrisma.checkout.findUnique.mockResolvedValue({
        id: CHECKOUT_ID,
        buyerProfileId: BUYER_PROFILE_ID,
        status: CheckoutStatus.RESERVED,
        totalAmount: 220,
        orderId: ORDER_ID,
        expiresAt: new Date(),
        buyerNote: null,
        reservations: [],
      });

      const result = await service.getCheckout(USER_ID, CHECKOUT_ID);
      expect(result.id).toBe(CHECKOUT_ID);
      expect(result.status).toBe(CheckoutStatus.RESERVED);
    });

    it('throws NotFoundException when checkout is missing', async () => {
      mockPrisma.buyerProfile.findUnique.mockResolvedValue({ id: BUYER_PROFILE_ID });
      mockPrisma.checkout.findUnique.mockResolvedValue(null);

      await expect(service.getCheckout(USER_ID, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for wrong owner', async () => {
      mockPrisma.buyerProfile.findUnique.mockResolvedValue({ id: 'other_buyer' });
      mockPrisma.checkout.findUnique.mockResolvedValue({
        id: CHECKOUT_ID,
        buyerProfileId: BUYER_PROFILE_ID,
        status: CheckoutStatus.RESERVED,
        totalAmount: 220,
        orderId: ORDER_ID,
        expiresAt: new Date(),
        buyerNote: null,
        reservations: [],
      });

      await expect(service.getCheckout(USER_ID, CHECKOUT_ID)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('validateCartForCheckout (private — tested via initiateCheckout)', () => {
    it('throws BadRequestException when store is inactive', async () => {
      mockPrisma.store.findFirst.mockResolvedValue(null);
      await expect(
        service.initiateCheckout(USER_ID, { deliveryAddress: mockDeliveryAddress }),
      ).rejects.toThrow('Store is no longer accepting orders');
    });

    it('throws BadRequestException when product variant is inactive', async () => {
      mockPrisma.store.findFirst.mockResolvedValue({ id: STORE_ID });
      mockPrisma.productVariant.findFirst.mockResolvedValue(null);
      await expect(
        service.initiateCheckout(USER_ID, { deliveryAddress: mockDeliveryAddress }),
      ).rejects.toThrow('no longer available');
    });

    it('throws BadRequestException when inventory is insufficient', async () => {
      mockPrisma.store.findFirst.mockResolvedValue({
        id: STORE_ID,
        status: StoreStatus.APPROVED,
        isActive: true,
        latitude: 28.6139,
        longitude: 77.209,
        storeServiceAreas: [],
      });
      mockPrisma.productVariant.findFirst.mockResolvedValue({
        id: 'v1',
        isActive: true,
        inventory: { quantity: 1, reserved: 1 }, // available = 0
      });
      await expect(
        service.initiateCheckout(USER_ID, { deliveryAddress: mockDeliveryAddress }),
      ).rejects.toThrow('available');
    });

    it('throws BadRequestException when delivery is outside store service area', async () => {
      mockPrisma.store.findFirst.mockResolvedValue({
        id: STORE_ID,
        status: StoreStatus.APPROVED,
        isActive: true,
        latitude: 19.076,
        longitude: 72.877,
        storeServiceAreas: [
          {
            serviceArea: { centerLat: 19.08, centerLng: 72.88, radiusKm: 2 },
          },
        ],
      });
      mockPrisma.productVariant.findFirst.mockResolvedValue({
        id: 'v1',
        isActive: true,
        inventory: { quantity: 10, reserved: 0 },
      });

      await expect(
        service.initiateCheckout(USER_ID, { deliveryAddress: mockDeliveryAddress }),
      ).rejects.toThrow('Store does not deliver to your location.');
    });
  });
});
