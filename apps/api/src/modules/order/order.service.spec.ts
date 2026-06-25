import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { OrderService } from './order.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { OrderCacheService } from './order-cache.service';
import { RiderAssignmentService } from '../rider-assignment/rider-assignment.service';
import { ReservationService } from '../checkout/reservation.service';
import { OrderStatusHistoryService } from './order-status-history.service';

const USER_ID = 'user1';
const ORDER_ID = 'ord1';
const BUYER_PROFILE_ID = 'bp1';
const MERCHANT_PROFILE_ID = 'mp1';
const STORE_ID = 'store1';

function buildOrder(status: OrderStatus, overrides: Partial<any> = {}): any {
  return {
    id: ORDER_ID,
    orderNumber: 'JD-20260622-ABC',
    status,
    paymentMethod: PaymentMethod.RAZORPAY,
    paymentStatus: PaymentStatus.PAID,
    subtotal: 200,
    discountAmount: 0,
    deliveryFee: 20,
    taxAmount: 0,
    totalAmount: 220,
    deliveryAddress: { line1: '42 MG Road', city: 'Delhi', pincode: '110001' },
    buyerNote: null,
    cancelReason: null,
    paidAt: new Date(),
    completedAt: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    store: { id: STORE_ID, name: 'Test Store', slug: 'test-store', phone: null },
    buyerProfile: { id: BUYER_PROFILE_ID, name: 'Test Buyer' },
    items: [],
    statusHistory: [],
    payment: null,
    storeId: STORE_ID,
    buyerProfileId: BUYER_PROFILE_ID,
    ...overrides,
  };
}

const mockPrisma = {
  $transaction: jest.fn(),
  buyerProfile: { findUnique: jest.fn() },
  merchantProfile: { findUnique: jest.fn() },
  store: { findMany: jest.fn() },
  order: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  orderStatusHistory: { create: jest.fn() },
  payment: { findUnique: jest.fn(), update: jest.fn() },
};

const mockAudit = { log: jest.fn() };
const mockDomainEvents = { emit: jest.fn() };
const mockCache = { getDetail: jest.fn(), setDetail: jest.fn(), invalidate: jest.fn(), invalidateAll: jest.fn() };
const mockRiderAssignment = { autoAssign: jest.fn() };
const mockReservation = { releaseOrderReservations: jest.fn() };
const mockStatusHistory = { transition: jest.fn(), appendEntry: jest.fn(), recordInitial: jest.fn() };

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: DomainEventsService, useValue: mockDomainEvents },
        { provide: OrderCacheService, useValue: mockCache },
        { provide: RiderAssignmentService, useValue: mockRiderAssignment },
        { provide: ReservationService, useValue: mockReservation },
        { provide: OrderStatusHistoryService, useValue: mockStatusHistory },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    jest.clearAllMocks();
  });

  // ── Buyer order history ────────────────────────────────────────────────────

  describe('listBuyerOrders', () => {
    it('returns paginated orders for a buyer', async () => {
      mockPrisma.buyerProfile.findUnique.mockResolvedValue({ id: BUYER_PROFILE_ID });
      mockPrisma.order.findMany.mockResolvedValue([buildOrder(OrderStatus.PAID)]);
      mockPrisma.order.count.mockResolvedValue(1);

      const result = await service.listBuyerOrders(USER_ID, { page: 1, limit: 20 });

      expect(result.orders).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('throws NotFoundException when buyer profile missing', async () => {
      mockPrisma.buyerProfile.findUnique.mockResolvedValue(null);
      await expect(service.listBuyerOrders(USER_ID, {})).rejects.toThrow(NotFoundException);
    });
  });

  // ── Buyer order detail ─────────────────────────────────────────────────────

  describe('getBuyerOrder', () => {
    it('always fetches from DB for live ETA and caches result', async () => {
      mockPrisma.buyerProfile.findUnique.mockResolvedValue({ id: BUYER_PROFILE_ID });
      mockPrisma.order.findFirst.mockResolvedValue(buildOrder(OrderStatus.PAID));

      const result = await service.getBuyerOrder(USER_ID, ORDER_ID);

      expect(result).toMatchObject({ id: ORDER_ID });
      expect(mockPrisma.order.findFirst).toHaveBeenCalled();
      expect(mockCache.setDetail).toHaveBeenCalled();
    });

    it('fetches from DB and caches when cache miss', async () => {
      mockPrisma.buyerProfile.findUnique.mockResolvedValue({ id: BUYER_PROFILE_ID });
      mockCache.getDetail.mockResolvedValue(null);
      mockPrisma.order.findFirst.mockResolvedValue(buildOrder(OrderStatus.PAID));

      await service.getBuyerOrder(USER_ID, ORDER_ID);

      expect(mockPrisma.order.findFirst).toHaveBeenCalled();
      expect(mockCache.setDetail).toHaveBeenCalled();
    });

    it('throws NotFoundException for unknown order', async () => {
      mockPrisma.buyerProfile.findUnique.mockResolvedValue({ id: BUYER_PROFILE_ID });
      mockCache.getDetail.mockResolvedValue(null);
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(service.getBuyerOrder(USER_ID, 'unknown')).rejects.toThrow(NotFoundException);
    });
  });

  // ── Buyer cancellation ─────────────────────────────────────────────────────

  describe('cancelByBuyer', () => {
    beforeEach(() => {
      mockPrisma.buyerProfile.findUnique.mockResolvedValue({ id: BUYER_PROFILE_ID });
      mockPrisma.$transaction.mockResolvedValue([]);
      mockAudit.log.mockResolvedValue(undefined);
      mockDomainEvents.emit.mockResolvedValue(undefined);
      mockCache.invalidateAll.mockResolvedValue(undefined);
      mockStatusHistory.transition.mockResolvedValue(true);
    });

    it('cancels a PAID order (before confirmation)', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(buildOrder(OrderStatus.PAID));
      mockPrisma.payment.findUnique.mockResolvedValue({ id: 'pay1', razorpayPaymentId: 'rzp1' });
      mockStatusHistory.transition.mockResolvedValue(true);

      const result = await service.cancelByBuyer(USER_ID, ORDER_ID, {});

      expect(result.status).toBe(OrderStatus.CANCELLED_BY_BUYER);
      expect(mockStatusHistory.transition).toHaveBeenCalled();
    });

    it('cancels a PAYMENT_PENDING order (COD before confirmation)', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(
        buildOrder(OrderStatus.PAYMENT_PENDING, { paymentStatus: PaymentStatus.PENDING, paymentMethod: PaymentMethod.COD }),
      );

      const result = await service.cancelByBuyer(USER_ID, ORDER_ID, {});

      expect(result.status).toBe(OrderStatus.CANCELLED_BY_BUYER);
    });

    it('rejects cancellation after MERCHANT_ACCEPTED', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(buildOrder(OrderStatus.MERCHANT_ACCEPTED));

      await expect(service.cancelByBuyer(USER_ID, ORDER_ID, {})).rejects.toThrow(BadRequestException);
    });

    it('rejects cancellation of a PREPARING order', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(buildOrder(OrderStatus.PREPARING));

      await expect(service.cancelByBuyer(USER_ID, ORDER_ID, {})).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for unknown order', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(service.cancelByBuyer(USER_ID, ORDER_ID, {})).rejects.toThrow(NotFoundException);
    });
  });

  // ── Merchant state transitions ─────────────────────────────────────────────

  describe('advanceMerchantOrder', () => {
    beforeEach(() => {
      mockPrisma.merchantProfile.findUnique.mockResolvedValue({ id: MERCHANT_PROFILE_ID });
      mockPrisma.store.findMany.mockResolvedValue([{ id: STORE_ID }]);
      mockPrisma.order.findFirst.mockResolvedValue({ id: ORDER_ID }); // ownership check
      mockPrisma.$transaction.mockResolvedValue([]);
      mockAudit.log.mockResolvedValue(undefined);
      mockDomainEvents.emit.mockResolvedValue(undefined);
      mockCache.invalidateAll.mockResolvedValue(undefined);
      mockStatusHistory.transition.mockResolvedValue(true);
      mockRiderAssignment.autoAssign.mockResolvedValue(null);
    });

    it('PAID → MERCHANT_ACCEPTED (confirm)', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        buildOrder(OrderStatus.PAID, { storeId: STORE_ID }),
      );

      const result = await service.advanceMerchantOrder(
        USER_ID, ORDER_ID, OrderStatus.MERCHANT_ACCEPTED,
      );

      expect(result.status).toBe(OrderStatus.MERCHANT_ACCEPTED);
    });

    it('CREATED → MERCHANT_ACCEPTED (legacy paid orders)', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        buildOrder(OrderStatus.CREATED, { storeId: STORE_ID }),
      );

      const result = await service.advanceMerchantOrder(
        USER_ID, ORDER_ID, OrderStatus.MERCHANT_ACCEPTED,
      );

      expect(result.status).toBe(OrderStatus.MERCHANT_ACCEPTED);
    });

    it('MERCHANT_ACCEPTED → PREPARING', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        buildOrder(OrderStatus.MERCHANT_ACCEPTED, { storeId: STORE_ID }),
      );

      const result = await service.advanceMerchantOrder(
        USER_ID, ORDER_ID, OrderStatus.PREPARING,
      );

      expect(result.status).toBe(OrderStatus.PREPARING);
    });

    it('PREPARING → PACKING', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        buildOrder(OrderStatus.PREPARING, { storeId: STORE_ID }),
      );

      const result = await service.advanceMerchantOrder(
        USER_ID, ORDER_ID, OrderStatus.PACKING,
      );

      expect(result.status).toBe(OrderStatus.PACKING);
    });

    it('PACKING → READY_FOR_PICKUP triggers auto-assign', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        buildOrder(OrderStatus.PACKING, { storeId: STORE_ID }),
      );
      mockRiderAssignment.autoAssign.mockResolvedValue({
        deliveryId: 'del1',
        riderProfileId: 'rp1',
      });

      const result = await service.advanceMerchantOrder(
        USER_ID, ORDER_ID, OrderStatus.READY_FOR_PICKUP,
      );

      expect(result.status).toBe(OrderStatus.READY_FOR_PICKUP);
      await new Promise((r) => setTimeout(r, 10));
      expect(mockRiderAssignment.autoAssign).toHaveBeenCalledWith(ORDER_ID);
    });

    it('PACKING → READY_FOR_PICKUP', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        buildOrder(OrderStatus.PACKING, { storeId: STORE_ID }),
      );

      const result = await service.advanceMerchantOrder(
        USER_ID, ORDER_ID, OrderStatus.READY_FOR_PICKUP,
      );

      expect(result.status).toBe(OrderStatus.READY_FOR_PICKUP);
    });

    it('rejects PREPARING → READY_FOR_PICKUP (must pack first)', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        buildOrder(OrderStatus.PREPARING, { storeId: STORE_ID }),
      );

      await expect(
        service.advanceMerchantOrder(USER_ID, ORDER_ID, OrderStatus.READY_FOR_PICKUP),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid transition PAID → PREPARING', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        buildOrder(OrderStatus.PAID, { storeId: STORE_ID }),
      );

      await expect(
        service.advanceMerchantOrder(USER_ID, ORDER_ID, OrderStatus.PREPARING),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects transition on terminal status', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        buildOrder(OrderStatus.CANCELLED_BY_BUYER, { storeId: STORE_ID }),
      );

      await expect(
        service.advanceMerchantOrder(USER_ID, ORDER_ID, OrderStatus.MERCHANT_ACCEPTED),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when merchant has no stores', async () => {
      mockPrisma.store.findMany.mockResolvedValue([]);

      await expect(
        service.advanceMerchantOrder(USER_ID, ORDER_ID, OrderStatus.MERCHANT_ACCEPTED),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── Merchant cancellation ─────────────────────────────────────────────────

  describe('cancelByMerchant', () => {
    beforeEach(() => {
      mockPrisma.merchantProfile.findUnique.mockResolvedValue({ id: MERCHANT_PROFILE_ID });
      mockPrisma.store.findMany.mockResolvedValue([{ id: STORE_ID }]);
      mockPrisma.order.findFirst.mockResolvedValue({ id: ORDER_ID });
      mockPrisma.$transaction.mockResolvedValue([]);
      mockAudit.log.mockResolvedValue(undefined);
      mockDomainEvents.emit.mockResolvedValue(undefined);
      mockCache.invalidateAll.mockResolvedValue(undefined);
      mockStatusHistory.transition.mockResolvedValue(true);
    });

    it('allows cancellation of PREPARING order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        buildOrder(OrderStatus.PREPARING, { storeId: STORE_ID }),
      );
      mockPrisma.payment.findUnique.mockResolvedValue({ id: 'pay1', razorpayPaymentId: 'rzp1' });

      const result = await service.cancelByMerchant(USER_ID, ORDER_ID, { reason: 'Out of stock' });

      expect(result.status).toBe(OrderStatus.CANCELLED_BY_MERCHANT);
    });

    it('rejects cancellation after READY_FOR_PICKUP', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        buildOrder(OrderStatus.READY_FOR_PICKUP, { storeId: STORE_ID }),
      );

      await expect(service.cancelByMerchant(USER_ID, ORDER_ID, {})).rejects.toThrow(BadRequestException);
    });

    it('rejects cancellation of DELIVERED order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        buildOrder(OrderStatus.DELIVERED, { storeId: STORE_ID }),
      );

      await expect(service.cancelByMerchant(USER_ID, ORDER_ID, {})).rejects.toThrow(BadRequestException);
    });
  });
});
