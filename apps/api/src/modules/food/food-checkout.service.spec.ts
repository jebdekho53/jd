import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FoodCheckoutService } from './food-checkout.service';
import { PrismaService } from '../../database/prisma.service';
import { FoodCartService } from './food-cart.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { GeospatialService } from '../geospatial/geospatial.service';
import { OrderFinancialsService } from '../finance/order-financials.service';
import { PaymentMethod, OrderStatus, OrderVertical } from '@prisma/client';

describe('FoodCheckoutService', () => {
  let service: FoodCheckoutService;
  const prisma = {
    buyerProfile: { findUnique: jest.fn() },
    order: { findUnique: jest.fn(), create: jest.fn() },
    foodCheckout: { findUnique: jest.fn(), create: jest.fn() },
    foodCart: { deleteMany: jest.fn() },
    restaurantMenuItem: { count: jest.fn() },
    $transaction: jest.fn((fn: (tx: unknown) => unknown) =>
      fn({
        order: { create: jest.fn().mockResolvedValue({
          id: 'o1',
          orderNumber: 'JDF-001',
          status: OrderStatus.MERCHANT_ACCEPTED,
        }) },
        foodCart: { deleteMany: jest.fn() },
      }),
    ),
  };
  const foodCart = { getFoodCart: jest.fn() };
  const audit = { log: jest.fn() };
  const domainEvents = { emit: jest.fn() };
  const geospatial = { validateCheckoutLocation: jest.fn() };
  // Called fire-and-forget (`void`) after the order commits; just needs to resolve.
  const orderFinancials = { freezeOnOrderCreate: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodCheckoutService,
        { provide: PrismaService, useValue: prisma },
        { provide: FoodCartService, useValue: foodCart },
        { provide: AuditService, useValue: audit },
        { provide: DomainEventsService, useValue: domainEvents },
        { provide: GeospatialService, useValue: geospatial },
        { provide: OrderFinancialsService, useValue: orderFinancials },
      ],
    }).compile();
    service = module.get(FoodCheckoutService);
    jest.clearAllMocks();
  });

  it('creates COD food order without dispatch side effects', async () => {
    foodCart.getFoodCart.mockResolvedValue({
      storeId: 's1',
      store: { minOrderAmount: 100 },
      items: [{ menuItemId: 'm1', menuItem: { name: 'Biryani' }, quantity: 1, unitPrice: 250, lineTotal: 250, addons: [] }],
      totals: { subtotal: 250, packagingFee: 10, deliveryFee: 20, tax: 12, grandTotal: 292 },
    });
    prisma.buyerProfile.findUnique.mockResolvedValue({ id: 'bp1' });
    prisma.restaurantMenuItem.count.mockResolvedValue(0);
    prisma.order.findUnique.mockResolvedValue(null);
    prisma.foodCheckout.findUnique.mockResolvedValue(null);

    const result = await service.initiateCheckout('user1', {
      paymentMethod: PaymentMethod.COD,
      deliveryLat: 12.9,
      deliveryLng: 77.6,
      deliveryAddress: { line1: 'A', pincode: '560001' },
    } as never);

    expect(result).toMatchObject({ orderId: 'o1', orderNumber: 'JDF-001' });
    expect(prisma.foodCheckout.create).not.toHaveBeenCalled();
  });

  it('creates Razorpay checkout stub without merchant-visible order', async () => {
    foodCart.getFoodCart.mockResolvedValue({
      storeId: 's1',
      store: { minOrderAmount: 100 },
      items: [{ menuItemId: 'm1', menuItem: { name: 'Biryani' }, quantity: 1, unitPrice: 250, lineTotal: 250, addons: [] }],
      totals: { subtotal: 250, packagingFee: 10, deliveryFee: 20, tax: 12, grandTotal: 292 },
    });
    prisma.buyerProfile.findUnique.mockResolvedValue({ id: 'bp1' });
    prisma.restaurantMenuItem.count.mockResolvedValue(0);
    prisma.order.findUnique.mockResolvedValue(null);
    prisma.foodCheckout.findUnique.mockResolvedValue(null);
    prisma.foodCheckout.create.mockResolvedValue({
      id: 'fc1',
      totalAmount: 292,
      expiresAt: new Date(),
    });

    const result = await service.initiateCheckout('user1', {
      paymentMethod: PaymentMethod.RAZORPAY,
      deliveryLat: 12.9,
      deliveryLng: 77.6,
      deliveryAddress: { line1: 'A', pincode: '560001' },
    } as never);

    expect(result).toMatchObject({ checkoutId: 'fc1' });
    expect(prisma.foodCheckout.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cartSnapshot: expect.any(Object),
          paymentMethod: PaymentMethod.RAZORPAY,
        }),
      }),
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects checkout when menu items became unavailable', async () => {
    foodCart.getFoodCart.mockResolvedValue({
      storeId: 's1',
      store: { minOrderAmount: 50 },
      items: [{ menuItemId: 'm1', menuItem: { name: 'Biryani' }, quantity: 1, unitPrice: 250, lineTotal: 250, addons: [] }],
      totals: { subtotal: 250, packagingFee: 0, deliveryFee: 0, tax: 0, grandTotal: 250 },
    });
    prisma.buyerProfile.findUnique.mockResolvedValue({ id: 'bp1' });
    prisma.restaurantMenuItem.count.mockResolvedValue(1);

    await expect(
      service.initiateCheckout('user1', {
        paymentMethod: PaymentMethod.COD,
        deliveryLat: 12.9,
        deliveryLng: 77.6,
        deliveryAddress: {},
      } as never),
    ).rejects.toThrow(BadRequestException);
  });
});
