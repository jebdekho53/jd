import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryStatus, KycStatus, OrderStatus, RiderStatus } from '@prisma/client';
import { DeliveryService } from './delivery.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { deliveryServiceMocks } from '../../test/nest-mock-providers';
import { OrderDeliveredHandlerService } from '../order/order-delivered-handler.service';
import { ReservationService } from '../checkout/reservation.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { DeliveryTrackingService } from '../delivery-tracking/delivery-tracking.service';
import { BuyerPushNotificationService } from '../push/buyer-push-notification.service';

const orderDelivered = { handleDelivered: jest.fn().mockResolvedValue(undefined) };

const USER_ID = 'user1';
const ORDER_ID = 'ord1';
const RIDER_PROFILE_ID = 'rp1';
const DELIVERY_ID = 'del1';

function buildDelivery(status: DeliveryStatus, orderStatus: string = OrderStatus.RIDER_ASSIGNED): any {
  return {
    id: DELIVERY_ID,
    orderId: ORDER_ID,
    status,
    riderProfileId: RIDER_PROFILE_ID,
    order: { status: orderStatus },
  };
}

const mockPrisma = {
  $transaction: jest.fn(),
  riderProfile: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  delivery: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  deliveryAssignment: {
    updateMany: jest.fn(),
  },
  order: {
    update: jest.fn(),
    findUnique: jest.fn().mockResolvedValue({
      status: OrderStatus.RIDER_ASSIGNED,
      orderNumber: 'JD-1',
      storeId: 'store1',
    }),
  },
  orderFinancialSnapshot: { findUnique: jest.fn().mockResolvedValue(null) },
  orderStatusHistory: { create: jest.fn() },
};

const mockAudit = { log: jest.fn() };
const mockDomainEvents = { emit: jest.fn() };

describe('DeliveryService', () => {
  let service: DeliveryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: DomainEventsService, useValue: mockDomainEvents },
        { provide: OrderDeliveredHandlerService, useValue: orderDelivered },
        { provide: ReservationService, useValue: deliveryServiceMocks.reservation },
        { provide: OrderStatusHistoryService, useValue: deliveryServiceMocks.statusHistory },
        { provide: DeliveryTrackingService, useValue: deliveryServiceMocks.tracking },
        { provide: BuyerPushNotificationService, useValue: deliveryServiceMocks.buyerPush },
      ],
    }).compile();

    service = module.get<DeliveryService>(DeliveryService);
    jest.clearAllMocks();

    // Default rider profile mock — approved, online
    mockPrisma.riderProfile.findUnique.mockResolvedValue({
      id: RIDER_PROFILE_ID,
      status: RiderStatus.ON_DELIVERY,
      kycStatus: KycStatus.APPROVED,
    });

    mockPrisma.$transaction.mockResolvedValue([]);
    mockAudit.log.mockResolvedValue(undefined);
    mockDomainEvents.emit.mockResolvedValue(undefined);
  });

  // ── State machine happy paths ──────────────────────────────────────────────

  describe('acceptDelivery', () => {
    it('ASSIGNED → ACCEPTED', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue(
        buildDelivery(DeliveryStatus.ASSIGNED, OrderStatus.READY_FOR_PICKUP),
      );

      const result = await service.acceptDelivery(USER_ID, ORDER_ID);
      expect(result.status).toBe(DeliveryStatus.ACCEPTED);
      expect(mockPrisma.delivery.update).toHaveBeenCalled();
    });

    it('rejects if delivery is not ASSIGNED', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue(
        buildDelivery(DeliveryStatus.ACCEPTED),
      );
      await expect(service.acceptDelivery(USER_ID, ORDER_ID)).rejects.toThrow(BadRequestException);
    });
  });

  describe('arrivedAtStore', () => {
    it('ACCEPTED → ARRIVED_AT_STORE', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue(buildDelivery(DeliveryStatus.ACCEPTED));
      const result = await service.arrivedAtStore(USER_ID, ORDER_ID);
      expect(result.status).toBe(DeliveryStatus.ARRIVED_AT_STORE);
    });

    it('rejects from wrong status', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue(buildDelivery(DeliveryStatus.ASSIGNED));
      await expect(service.arrivedAtStore(USER_ID, ORDER_ID)).rejects.toThrow(BadRequestException);
    });
  });

  describe('pickedUp', () => {
    it('ARRIVED_AT_STORE → PICKED_UP', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue(buildDelivery(DeliveryStatus.ARRIVED_AT_STORE));
      const result = await service.pickedUp(USER_ID, ORDER_ID);
      expect(result.status).toBe(DeliveryStatus.PICKED_UP);
    });
  });

  describe('arrivedAtCustomer', () => {
    it('PICKED_UP → ARRIVED_AT_CUSTOMER', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue(buildDelivery(DeliveryStatus.PICKED_UP));
      const result = await service.arrivedAtCustomer(USER_ID, ORDER_ID);
      expect(result.status).toBe(DeliveryStatus.ARRIVED_AT_CUSTOMER);
    });
  });

  describe('markDelivered', () => {
    it('ARRIVED_AT_CUSTOMER → DELIVERED', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue(buildDelivery(DeliveryStatus.ARRIVED_AT_CUSTOMER));
      const result = await service.markDelivered(USER_ID, ORDER_ID);
      expect(result.status).toBe(DeliveryStatus.DELIVERED);
    });

    it('rejects an already-delivered delivery', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue(buildDelivery(DeliveryStatus.DELIVERED));
      await expect(service.markDelivered(USER_ID, ORDER_ID)).rejects.toThrow(BadRequestException);
    });
  });

  // ── Failure path ───────────────────────────────────────────────────────────

  describe('markFailed', () => {
    it('marks any non-terminal delivery as FAILED', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue(buildDelivery(DeliveryStatus.PICKED_UP));

      const result = await service.markFailed(USER_ID, ORDER_ID, 'Customer not available');
      expect(result.status).toBe(DeliveryStatus.FAILED);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('rejects marking an already-terminal delivery as FAILED', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue(buildDelivery(DeliveryStatus.DELIVERED));
      await expect(service.markFailed(USER_ID, ORDER_ID)).rejects.toThrow(BadRequestException);
    });
  });

  // ── Security ───────────────────────────────────────────────────────────────

  describe('ownership enforcement', () => {
    it('throws ForbiddenException when delivery belongs to another rider', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue(null); // not found for this rider
      await expect(service.acceptDelivery(USER_ID, ORDER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when rider KYC is not approved', async () => {
      mockPrisma.riderProfile.findUnique.mockResolvedValue({
        id: RIDER_PROFILE_ID,
        status: RiderStatus.ONLINE,
        kycStatus: KycStatus.PENDING,
      });
      await expect(service.acceptDelivery(USER_ID, ORDER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when rider profile does not exist', async () => {
      mockPrisma.riderProfile.findUnique.mockResolvedValue(null);
      await expect(service.acceptDelivery(USER_ID, ORDER_ID)).rejects.toThrow(NotFoundException);
    });
  });
});
