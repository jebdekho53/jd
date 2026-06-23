import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReservationStatus } from '@prisma/client';
import { ReservationService } from './reservation.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';

const mockPrisma = {
  $transaction: jest.fn(),
  $executeRaw: jest.fn(),
  inventoryReservation: {
    create: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  inventory: {
    findUnique: jest.fn(),
  },
  checkout: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

const mockAudit = { log: jest.fn() };
const mockDomainEvents = { emit: jest.fn() };

describe('ReservationService', () => {
  let service: ReservationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: DomainEventsService, useValue: mockDomainEvents },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
    jest.clearAllMocks();
  });

  describe('reserveInventory', () => {
    it('reserves inventory atomically for all items', async () => {
      const items = [
        { variantId: 'v1', quantity: 2 },
        { variantId: 'v2', quantity: 1 },
      ];

      // $transaction should call the cb with a tx object
      mockPrisma.$transaction.mockImplementation((cb: Function) =>
        cb({
          $executeRaw: jest.fn().mockResolvedValue(1),
          inventoryReservation: { create: jest.fn() },
        }),
      );
      mockDomainEvents.emit.mockResolvedValue(undefined);

      await expect(
        service.reserveInventory('chk1', items, 'user1'),
      ).resolves.toBeUndefined();

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('throws BadRequestException when stock is insufficient', async () => {
      const txMock = {
        $executeRaw: jest.fn().mockResolvedValue(0), // 0 rows affected = insufficient stock
        inventoryReservation: { create: jest.fn() },
        inventory: {
          findUnique: jest.fn().mockResolvedValue({ quantity: 3, reserved: 2 }),
        },
      };
      mockPrisma.$transaction.mockImplementation((cb: Function) => cb(txMock));

      await expect(
        service.reserveInventory('chk1', [{ variantId: 'v1', quantity: 2 }], 'user1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when inventory record is missing', async () => {
      const txMock = {
        $executeRaw: jest.fn().mockResolvedValue(0),
        inventoryReservation: { create: jest.fn() },
        inventory: { findUnique: jest.fn().mockResolvedValue(null) },
      };
      mockPrisma.$transaction.mockImplementation((cb: Function) => cb(txMock));

      await expect(
        service.reserveInventory('chk1', [{ variantId: 'v_missing', quantity: 1 }], 'user1'),
      ).rejects.toThrow('Inventory record not found');
    });
  });

  describe('releaseReservations', () => {
    it('releases all active reservations for a checkout', async () => {
      const reservations = [
        { id: 'r1', variantId: 'v1', quantity: 2 },
        { id: 'r2', variantId: 'v2', quantity: 1 },
      ];
      mockPrisma.inventoryReservation.findMany.mockResolvedValue(reservations);
      mockPrisma.$transaction.mockImplementation((cb: Function) =>
        cb({
          $executeRaw: jest.fn().mockResolvedValue(1),
          inventoryReservation: { updateMany: jest.fn() },
        }),
      );
      mockDomainEvents.emit.mockResolvedValue(undefined);

      await service.releaseReservations('chk1', 'EXPIRED');

      expect(mockPrisma.inventoryReservation.findMany).toHaveBeenCalledWith({
        where: { checkoutId: 'chk1', status: ReservationStatus.ACTIVE },
        select: { id: true, variantId: true, quantity: true },
      });
    });

    it('is a no-op when no active reservations exist', async () => {
      mockPrisma.inventoryReservation.findMany.mockResolvedValue([]);

      await service.releaseReservations('chk1', 'CANCELLED');

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('consumeReservations', () => {
    it('deducts stock and marks reservations CONSUMED', async () => {
      const reservations = [{ id: 'r1', variantId: 'v1', quantity: 3 }];
      mockPrisma.inventoryReservation.findMany.mockResolvedValue(reservations);
      mockPrisma.$transaction.mockImplementation((cb: Function) =>
        cb({
          $executeRaw: jest.fn().mockResolvedValue(1),
          inventoryReservation: { updateMany: jest.fn() },
        }),
      );

      await service.consumeReservations('chk1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('logs a warning and returns if no active reservations', async () => {
      mockPrisma.inventoryReservation.findMany.mockResolvedValue([]);
      const logSpy = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => {});

      await service.consumeReservations('chk1');

      expect(logSpy).toHaveBeenCalled();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('releaseExpiredReservations (cron)', () => {
    it('releases all checkouts with expired active reservations', async () => {
      const expiredCheckouts = [
        { id: 'chk1', buyerProfileId: 'bp1' },
        { id: 'chk2', buyerProfileId: 'bp2' },
      ];
      mockPrisma.checkout.findMany.mockResolvedValue(expiredCheckouts);
      mockPrisma.inventoryReservation.findMany.mockResolvedValue([
        { id: 'r1', variantId: 'v1', quantity: 1 },
      ]);
      mockPrisma.$transaction.mockImplementation((cb: Function) =>
        cb({
          $executeRaw: jest.fn().mockResolvedValue(1),
          inventoryReservation: { updateMany: jest.fn() },
        }),
      );
      mockPrisma.checkout.update.mockResolvedValue({});
      mockAudit.log.mockResolvedValue(undefined);
      mockDomainEvents.emit.mockResolvedValue(undefined);

      await service.releaseExpiredReservations();

      expect(mockPrisma.checkout.update).toHaveBeenCalledTimes(2);
    });

    it('is a no-op when no expired reservations exist', async () => {
      mockPrisma.checkout.findMany.mockResolvedValue([]);

      await service.releaseExpiredReservations();

      expect(mockPrisma.checkout.update).not.toHaveBeenCalled();
    });
  });
});
