import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryStatus, KycStatus, OrderStatus, RiderStatus } from '@prisma/client';
import { RiderAssignmentService } from './rider-assignment.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';

const ORDER_ID = 'ord1';
const RIDER_ID = 'rp1';
const ADMIN_ID = 'admin1';
const DELIVERY_ID = 'del1';
const STORE_ID = 'store1';

const mockPrisma = {
  $transaction: jest.fn(),
  order: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  orderStatusHistory: { create: jest.fn() },
  riderProfile: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  delivery: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  deliveryAssignment: {
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  storeZone: { findMany: jest.fn() },
};

const mockAudit = { log: jest.fn() };
const mockDomainEvents = { emit: jest.fn() };

const buildOrder = (status: string = OrderStatus.READY_FOR_PICKUP): any => ({
  id: ORDER_ID,
  orderNumber: 'JD-XYZ',
  status,
  delivery: null,
  deliveryLat: 28.62,
  deliveryLng: 77.21,
  store: {
    id: STORE_ID,
    latitude: 28.61,
    longitude: 77.20,
    storeZones: [{ zoneId: 'zone1' }],
  },
});

const buildRider = (overrides = {}): any => ({
  id: RIDER_ID,
  status: RiderStatus.ONLINE,
  kycStatus: KycStatus.APPROVED,
  currentLat: 28.605,
  currentLng: 77.19,
  ...overrides,
});

describe('RiderAssignmentService', () => {
  let service: RiderAssignmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiderAssignmentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: DomainEventsService, useValue: mockDomainEvents },
      ],
    }).compile();

    service = module.get<RiderAssignmentService>(RiderAssignmentService);
    jest.clearAllMocks();

    mockPrisma.$transaction.mockResolvedValue([]);
    mockAudit.log.mockResolvedValue(undefined);
    mockDomainEvents.emit.mockResolvedValue(undefined);
  });

  // ── Manual assignment ──────────────────────────────────────────────────────

  describe('assignRider', () => {
    beforeEach(() => {
      mockPrisma.order.findUnique.mockResolvedValue(buildOrder());
      mockPrisma.riderProfile.findUnique.mockResolvedValue(buildRider());
      mockPrisma.delivery.create.mockResolvedValue({ id: DELIVERY_ID });
      mockPrisma.deliveryAssignment.create.mockResolvedValue({});
    });

    it('assigns an ONLINE approved rider to a READY_FOR_PICKUP order', async () => {
      const result = await service.assignRider(ORDER_ID, RIDER_ID, ADMIN_ID);

      expect(result.riderProfileId).toBe(RIDER_ID);
      expect(result.deliveryId).toBeDefined();
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('throws BadRequestException when order is not READY_FOR_PICKUP', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(buildOrder(OrderStatus.PREPARING));
      await expect(service.assignRider(ORDER_ID, RIDER_ID, ADMIN_ID)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);
      await expect(service.assignRider(ORDER_ID, RIDER_ID, ADMIN_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when rider not found', async () => {
      mockPrisma.riderProfile.findUnique.mockResolvedValue(null);
      await expect(service.assignRider(ORDER_ID, RIDER_ID, ADMIN_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when rider KYC not approved', async () => {
      mockPrisma.riderProfile.findUnique.mockResolvedValue(buildRider({ kycStatus: KycStatus.PENDING }));
      await expect(service.assignRider(ORDER_ID, RIDER_ID, ADMIN_ID)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when rider is OFFLINE', async () => {
      mockPrisma.riderProfile.findUnique.mockResolvedValue(buildRider({ status: RiderStatus.OFFLINE }));
      await expect(service.assignRider(ORDER_ID, RIDER_ID, ADMIN_ID)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when order already has an active assignment', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(
        buildOrder(OrderStatus.READY_FOR_PICKUP) && {
          ...buildOrder(),
          delivery: { status: DeliveryStatus.ASSIGNED },
        },
      );
      await expect(service.assignRider(ORDER_ID, RIDER_ID, ADMIN_ID)).rejects.toThrow(BadRequestException);
    });
  });

  // ── Auto-assignment ────────────────────────────────────────────────────────

  describe('autoAssign', () => {
    it('returns null when no eligible riders exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(buildOrder());
      mockPrisma.riderProfile.findMany.mockResolvedValue([]);

      const result = await service.autoAssign(ORDER_ID);
      expect(result).toBeNull();
    });

    it('returns null when all eligible riders are at max capacity', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(buildOrder());
      mockPrisma.riderProfile.findMany.mockResolvedValue([
        { ...buildRider(), zones: [], _count: { deliveries: 1 } }, // at max (MAX_ACTIVE_DELIVERIES = 1)
      ]);

      const result = await service.autoAssign(ORDER_ID);
      expect(result).toBeNull();
    });

    it('selects same-zone rider over out-of-zone rider', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(buildOrder());
      mockPrisma.riderProfile.findMany.mockResolvedValue([
        {
          id: 'riderA',
          currentLat: 28.7,
          currentLng: 77.3,
          zones: [], // out of zone
          _count: { deliveries: 0 },
        },
        {
          id: 'riderB',
          currentLat: 28.7,
          currentLng: 77.3,
          zones: [{ zoneId: 'zone1' }], // same zone
          _count: { deliveries: 0 },
        },
      ]);
      mockPrisma.delivery.create.mockResolvedValue({ id: DELIVERY_ID });
      mockPrisma.deliveryAssignment.create.mockResolvedValue({});

      const result = await service.autoAssign(ORDER_ID);

      expect(result?.riderProfileId).toBe('riderB');
    });

    it('returns null when order is not READY_FOR_PICKUP', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(buildOrder(OrderStatus.PREPARING));

      const result = await service.autoAssign(ORDER_ID);
      expect(result).toBeNull();
    });
  });

  // ── Reassignment ───────────────────────────────────────────────────────────

  describe('reassignRider', () => {
    it('cancels previous assignment and creates new one', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue({
        id: DELIVERY_ID,
        status: DeliveryStatus.ASSIGNED,
        riderProfileId: 'oldRider',
        order: { id: ORDER_ID, orderNumber: 'JD-XYZ', status: OrderStatus.RIDER_ASSIGNED },
      });
      mockPrisma.riderProfile.findUnique.mockResolvedValue(buildRider({ id: 'newRider' }));
      mockPrisma.deliveryAssignment.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.delivery.update.mockResolvedValue({ id: DELIVERY_ID });
      mockPrisma.deliveryAssignment.create.mockResolvedValue({});

      const result = await service.reassignRider(ORDER_ID, 'newRider', ADMIN_ID);

      expect(result.riderProfileId).toBe('newRider');
      expect(mockPrisma.deliveryAssignment.updateMany).toHaveBeenCalled();
    });

    it('throws BadRequestException when delivery is already DELIVERED', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue({
        id: DELIVERY_ID,
        status: DeliveryStatus.DELIVERED,
        riderProfileId: 'oldRider',
        order: { id: ORDER_ID, orderNumber: 'JD-XYZ', status: OrderStatus.DELIVERED },
      });

      await expect(service.reassignRider(ORDER_ID, 'newRider', ADMIN_ID)).rejects.toThrow(BadRequestException);
    });
  });
});
