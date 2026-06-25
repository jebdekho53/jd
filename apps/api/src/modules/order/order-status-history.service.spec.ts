import { Test, TestingModule } from '@nestjs/testing';
import { OrderActorType, OrderStatus } from '@prisma/client';
import { OrderStatusHistoryService } from './order-status-history.service';
import { PrismaService } from '../../database/prisma.service';
import { OrderCacheService } from './order-cache.service';

const mockPrisma = {
  order: { findUnique: jest.fn(), update: jest.fn() },
  orderStatusHistory: { create: jest.fn() },
  $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
};

const mockCache = { invalidateAll: jest.fn() };

describe('OrderStatusHistoryService', () => {
  let service: OrderStatusHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderStatusHistoryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OrderCacheService, useValue: mockCache },
      ],
    }).compile();
    service = module.get(OrderStatusHistoryService);
    jest.clearAllMocks();
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'o1', status: OrderStatus.PAID });
    mockCache.invalidateAll.mockResolvedValue(undefined);
  });

  it('records status transition and invalidates cache', async () => {
    await service.transition({
      orderId: 'o1',
      toStatus: OrderStatus.MERCHANT_ACCEPTED,
      actorType: OrderActorType.MERCHANT,
      actorId: 'merchant-1',
      note: 'Accepted',
    });

    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockCache.invalidateAll).toHaveBeenCalledWith('o1');
  });

  it('skips duplicate status when skipIfAlreadyStatus is true', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'o1', status: OrderStatus.PAID });
    const result = await service.transition({
      orderId: 'o1',
      toStatus: OrderStatus.PAID,
      actorType: OrderActorType.SYSTEM,
      skipIfAlreadyStatus: true,
    });
    expect(result).toBe(false);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});
