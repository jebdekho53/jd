import { Test, TestingModule } from '@nestjs/testing';
import { ReservationService } from './reservation.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { InventoryService } from '../inventory/inventory.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { OrderCacheService } from '../order/order-cache.service';

const mockPrisma = {
  checkout: { findMany: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
  order: { findUnique: jest.fn(), findMany: jest.fn() },
  payment: { updateMany: jest.fn() },
};

const mockStatusHistory = { transition: jest.fn() };
const mockOrderCache = { invalidateAll: jest.fn() };

const mockInventory = {
  reserveForCheckout: jest.fn(),
  linkReservationsToOrder: jest.fn(),
  releaseByCheckout: jest.fn(),
  releaseByOrder: jest.fn(),
  fulfillOnDelivery: jest.fn(),
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
        { provide: InventoryService, useValue: mockInventory },
        { provide: OrderStatusHistoryService, useValue: mockStatusHistory },
        { provide: OrderCacheService, useValue: mockOrderCache },
      ],
    }).compile();

    service = module.get(ReservationService);
    jest.clearAllMocks();
    mockDomainEvents.emit.mockResolvedValue(undefined);
  });

  it('delegates reserve to InventoryService', async () => {
    mockInventory.reserveForCheckout.mockResolvedValue(undefined);
    await service.reserveInventory(
      'chk1',
      [{ variantId: 'v1', productId: 'p1', quantity: 2 }],
      'user1',
    );
    expect(mockInventory.reserveForCheckout).toHaveBeenCalled();
  });

  it('delegates release to InventoryService', async () => {
    mockInventory.releaseByCheckout.mockResolvedValue(undefined);
    await service.releaseReservations('chk1', 'CANCELLED');
    expect(mockInventory.releaseByCheckout).toHaveBeenCalledWith('chk1', 'CANCELLED');
  });

  it('fulfills on delivery via InventoryService', async () => {
    mockInventory.fulfillOnDelivery.mockResolvedValue(undefined);
    await service.fulfillOnDelivery('order-1');
    expect(mockInventory.fulfillOnDelivery).toHaveBeenCalledWith('order-1');
  });
});
