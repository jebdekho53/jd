import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DeliveryStatus, KycStatus, OrderStatus, RiderStatus } from '@prisma/client';
import { RiderAssignmentService } from './rider-assignment.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { RiderAssignmentCacheService } from './rider-assignment-cache.service';

const ORDER_ID = 'ord1';
const RIDER_ID = 'rp1';
const ADMIN_ID = 'admin1';
const DELIVERY_ID = 'del1';
const STORE_ID = 'store1';

const mockPrisma = {
  order: { findUnique: jest.fn(), count: jest.fn(), findMany: jest.fn() },
  riderProfile: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
  delivery: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
  deliveryAssignment: { create: jest.fn(), updateMany: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  store: { findUnique: jest.fn() },
};

const mockAudit = { log: jest.fn() };
const mockDomainEvents = { emit: jest.fn() };
const mockStatusHistory = { transition: jest.fn() };
const mockCache = { invalidateAssignmentCaches: jest.fn() };
const mockEvents = { emit: jest.fn() };
const mockConfig = { get: jest.fn().mockReturnValue(30) };

const buildOrder = (status = OrderStatus.READY_FOR_PICKUP) => ({
  id: ORDER_ID,
  orderNumber: 'JD-XYZ',
  status,
  delivery: null,
  deliveryLat: 28.62,
  deliveryLng: 77.21,
  store: {
    id: STORE_ID,
    latitude: 28.61,
    longitude: 77.2,
    storeZones: [{ zoneId: 'zone1' }],
  },
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
        { provide: OrderStatusHistoryService, useValue: mockStatusHistory },
        { provide: RiderAssignmentCacheService, useValue: mockCache },
        { provide: EventEmitter2, useValue: mockEvents },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get(RiderAssignmentService);
    jest.clearAllMocks();
    mockAudit.log.mockResolvedValue(undefined);
    mockDomainEvents.emit.mockResolvedValue(undefined);
    mockStatusHistory.transition.mockResolvedValue(true);
    mockCache.invalidateAssignmentCaches.mockResolvedValue(undefined);
    mockPrisma.riderProfile.update.mockResolvedValue({});
    mockPrisma.delivery.create.mockResolvedValue({ id: DELIVERY_ID });
    mockPrisma.deliveryAssignment.create.mockResolvedValue({});
  });

  describe('autoAssign', () => {
    it('returns null when no zone-matched riders exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(buildOrder());
      mockPrisma.store.findUnique.mockResolvedValue({
        latitude: 28.61,
        longitude: 77.2,
        storeZones: [{ zoneId: 'zone1' }],
      });
      mockPrisma.riderProfile.findMany.mockResolvedValue([]);

      const result = await service.autoAssign(ORDER_ID);
      expect(result).toBeNull();
    });

    it('assigns same-zone rider and creates delivery', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(buildOrder());
      mockPrisma.store.findUnique.mockResolvedValue({
        latitude: 28.61,
        longitude: 77.2,
        storeZones: [{ zoneId: 'zone1' }],
      });
      mockPrisma.riderProfile.findMany.mockResolvedValue([
        {
          id: RIDER_ID,
          name: 'R1',
          status: RiderStatus.ONLINE,
          currentLat: 28.605,
          currentLng: 77.19,
          lastLocationAt: new Date(),
          updatedAt: new Date(),
          zones: [{ zoneId: 'zone1', zone: { id: 'zone1', name: 'Z1' } }],
          _count: { deliveries: 0 },
        },
      ]);

      mockPrisma.riderProfile.findUnique.mockResolvedValue({
        id: RIDER_ID,
        kycStatus: KycStatus.APPROVED,
        status: RiderStatus.ONLINE,
        currentLat: 28.605,
        currentLng: 77.19,
        user: { status: 'ACTIVE', deletedAt: null },
        zones: [{ zoneId: 'zone1' }],
        _count: { deliveries: 0 },
      });
      mockPrisma.order.findUnique.mockImplementation((args: { select?: { store?: unknown } }) => {
        if (args?.select?.store) {
          return Promise.resolve({ store: { storeZones: [{ zoneId: 'zone1' }] } });
        }
        return Promise.resolve(buildOrder());
      });

      const result = await service.autoAssign(ORDER_ID);
      expect(result?.riderProfileId).toBe(RIDER_ID);
      expect(mockPrisma.delivery.create).toHaveBeenCalled();
      expect(mockStatusHistory.transition).toHaveBeenCalled();
    });

    it('excludes offline riders', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(buildOrder());
      mockPrisma.store.findUnique.mockResolvedValue({
        latitude: 28.61,
        longitude: 77.2,
        storeZones: [{ zoneId: 'zone1' }],
      });
      mockPrisma.riderProfile.findMany.mockResolvedValue([]);

      await service.assign(ORDER_ID, RIDER_ID, ADMIN_ID).catch(() => undefined);
      mockPrisma.riderProfile.findUnique.mockResolvedValue({
        id: RIDER_ID,
        kycStatus: KycStatus.APPROVED,
        status: RiderStatus.OFFLINE,
        currentLat: 28.6,
        currentLng: 77.2,
        user: { status: 'ACTIVE', deletedAt: null },
        zones: [{ zoneId: 'zone1' }],
        _count: { deliveries: 0 },
      });
      mockPrisma.order.findUnique.mockResolvedValue(buildOrder());

      await expect(service.assign(ORDER_ID, RIDER_ID, ADMIN_ID)).rejects.toThrow(BadRequestException);
    });

    it('excludes riders with active delivery', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(buildOrder());
      mockPrisma.riderProfile.findUnique.mockResolvedValue({
        id: RIDER_ID,
        kycStatus: KycStatus.APPROVED,
        status: RiderStatus.ONLINE,
        currentLat: 28.6,
        currentLng: 77.2,
        user: { status: 'ACTIVE', deletedAt: null },
        zones: [{ zoneId: 'zone1' }],
        _count: { deliveries: 1 },
      });

      await expect(service.assign(ORDER_ID, RIDER_ID, ADMIN_ID)).rejects.toThrow(BadRequestException);
    });
  });

  describe('reassign', () => {
    it('reassigns to new rider', async () => {
      mockPrisma.delivery.findFirst.mockResolvedValue({
        id: DELIVERY_ID,
        status: DeliveryStatus.ASSIGNED,
        riderProfileId: 'old',
        order: { id: ORDER_ID, orderNumber: 'JD-XYZ', status: OrderStatus.RIDER_ASSIGNED },
      });
      mockPrisma.riderProfile.findUnique.mockResolvedValue({
        id: 'newRider',
        kycStatus: KycStatus.APPROVED,
        status: RiderStatus.ONLINE,
        currentLat: 28.6,
        currentLng: 77.2,
        user: { status: 'ACTIVE', deletedAt: null },
        zones: [{ zoneId: 'zone1' }],
        _count: { deliveries: 0 },
      });
      mockPrisma.order.findUnique.mockResolvedValue({
        store: { storeZones: [{ zoneId: 'zone1' }] },
      });
      mockPrisma.deliveryAssignment.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.delivery.update.mockResolvedValue({ id: DELIVERY_ID });
      mockPrisma.deliveryAssignment.create.mockResolvedValue({});

      const result = await service.reassign(ORDER_ID, 'newRider', ADMIN_ID);
      expect(result.riderProfileId).toBe('newRider');
    });
  });
});
