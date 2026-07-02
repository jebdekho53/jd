import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InventoryStatus } from '@prisma/client';
import { InventoryService } from './inventory.service';
import { INVENTORY_EVENTS } from './inventory.events';
import { PrismaService } from '../../database/prisma.service';
import { InventoryCacheService } from './inventory-cache.service';
import { InventoryAlertService } from './inventory-alert.service';

const mockPrisma = {
  $transaction: jest.fn(),
  $executeRaw: jest.fn(),
  $queryRaw: jest.fn(),
  inventory: {
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  inventoryReservation: { create: jest.fn(), updateMany: jest.fn(), findMany: jest.fn() },
  product: { findMany: jest.fn() },
  productVariant: { findMany: jest.fn(), findUnique: jest.fn() },
};

const mockCache = { invalidateForStores: jest.fn() };
const mockAlerts = { checkAndNotifyLowStock: jest.fn() };
const mockEvents = { emit: jest.fn() };

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: InventoryCacheService, useValue: mockCache },
        { provide: InventoryAlertService, useValue: mockAlerts },
        { provide: EventEmitter2, useValue: mockEvents },
      ],
    }).compile();

    service = module.get(InventoryService);
    jest.clearAllMocks();
    mockPrisma.productVariant.findMany.mockResolvedValue([
      { product: { storeId: 'store-1' } },
    ]);
    mockCache.invalidateForStores.mockResolvedValue(undefined);
  });

  describe('reserveForCheckout — Scenario 1: oversell prevention', () => {
    it('fails second buyer when only 5 available and first took 3', async () => {
      const tx = {
        $executeRaw: jest.fn().mockResolvedValue(0),
        inventory: {
          findUnique: jest.fn().mockResolvedValue({ availableQty: 2, status: InventoryStatus.ACTIVE }),
        },
        inventoryReservation: { create: jest.fn() },
      };
      mockPrisma.$transaction.mockImplementation((cb: Function) => cb(tx));

      await expect(
        service.reserveForCheckout(
          'chk-2',
          [{ variantId: 'v1', productId: 'p1', quantity: 3 }],
          new Date(),
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('releaseByOrder — Scenario 2: cancel restores stock', () => {
    it('returns reserved units to available on order cancel', async () => {
      mockPrisma.inventoryReservation.findMany.mockResolvedValue([
        { id: 'r1', variantId: 'v1', quantity: 10 },
      ]);
      const tx = {
        $executeRaw: jest.fn().mockResolvedValue(1),
        inventoryReservation: { updateMany: jest.fn() },
      };
      mockPrisma.$transaction.mockImplementation((cb: Function) => cb(tx));

      await service.releaseByOrder('order-1');
      expect(tx.$executeRaw).toHaveBeenCalled();
      expect(mockCache.invalidateForStores).toHaveBeenCalled();
    });
  });

  describe('fulfillOnDelivery — Scenario 3: delivery moves reserved to sold', () => {
    it('decrements reserved and increments sold on delivery', async () => {
      mockPrisma.inventoryReservation.findMany.mockResolvedValue([
        { id: 'r1', variantId: 'v1', quantity: 10 },
      ]);
      const tx = {
        $executeRaw: jest.fn().mockResolvedValue(1),
        inventoryReservation: { updateMany: jest.fn() },
      };
      mockPrisma.$transaction.mockImplementation((cb: Function) => cb(tx));

      await service.fulfillOnDelivery('order-1');
      expect(tx.$executeRaw).toHaveBeenCalled();
    });
  });

  describe('adjustAvailableQty — Scenario 4: low stock alert', () => {
    it('triggers alert when qty at threshold', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue({
        id: 'inv-1',
        availableQty: 10,
        reservedQty: 0,
        lowStockThreshold: 5,
        status: InventoryStatus.ACTIVE,
      });
      mockPrisma.inventory.update.mockResolvedValue({
        availableQty: 4,
        reservedQty: 0,
        soldQty: 0,
        status: InventoryStatus.ACTIVE,
      });

      await service.adjustAvailableQty('v1', 4, 5, 'merchant-1');
      expect(mockAlerts.checkAndNotifyLowStock).toHaveBeenCalledWith('v1', 'merchant-1');
    });
  });

  describe('adjustAvailableQty — back-in-stock event', () => {
    function mockInv(availableQty: number, status: InventoryStatus) {
      mockPrisma.inventory.findUnique.mockResolvedValue({
        id: 'inv-1',
        availableQty,
        reservedQty: 0,
        lowStockThreshold: 5,
        status,
      });
      mockPrisma.inventory.update.mockResolvedValue({
        availableQty: 0,
        reservedQty: 0,
        soldQty: 0,
        status: InventoryStatus.ACTIVE,
      });
      mockPrisma.productVariant.findUnique.mockResolvedValue({ productId: 'p1' });
    }

    it('emits BACK_IN_STOCK when stock goes from 0 to >0', async () => {
      mockInv(0, InventoryStatus.OUT_OF_STOCK);

      await service.adjustAvailableQty('v1', 8);

      expect(mockEvents.emit).toHaveBeenCalledWith(
        INVENTORY_EVENTS.BACK_IN_STOCK,
        { productId: 'p1', variantId: 'v1' },
      );
    });

    it('does NOT emit on a 0 -> 0 update', async () => {
      mockInv(0, InventoryStatus.OUT_OF_STOCK);

      await service.adjustAvailableQty('v1', 0);

      expect(mockEvents.emit).not.toHaveBeenCalled();
    });

    it('does NOT emit when the product was already in stock (5 -> 10)', async () => {
      mockInv(5, InventoryStatus.ACTIVE);

      await service.adjustAvailableQty('v1', 10);

      expect(mockEvents.emit).not.toHaveBeenCalled();
    });

    it('does NOT emit when inventory is DISABLED', async () => {
      mockInv(0, InventoryStatus.DISABLED);

      await service.adjustAvailableQty('v1', 8);

      expect(mockEvents.emit).not.toHaveBeenCalled();
    });
  });
});
