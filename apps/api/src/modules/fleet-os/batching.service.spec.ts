import { Test, TestingModule } from '@nestjs/testing';
import { BatchingService } from './batching.service';
import { PrismaService } from '../../database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { groupOrdersIntoBatches } from './batching.util';

describe('BatchingService', () => {
  let service: BatchingService;
  const mockPrisma = {
    deliveryBatch: { findFirst: jest.fn(), create: jest.fn() },
    delivery: { findMany: jest.fn() },
    order: { findMany: jest.fn() },
  };
  const mockEvents = { emit: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEvents },
      ],
    }).compile();
    service = module.get(BatchingService);
    jest.clearAllMocks();
  });

  it('groups orders by locality and pickup zone with max 3', () => {
    const orders = [
      { orderId: '1', locality: 'A', pickupZoneId: 'z1', deliveryLat: 1, deliveryLng: 1 },
      { orderId: '2', locality: 'A', pickupZoneId: 'z1', deliveryLat: 2, deliveryLng: 2 },
      { orderId: '3', locality: 'A', pickupZoneId: 'z1', deliveryLat: 3, deliveryLng: 3 },
      { orderId: '4', locality: 'A', pickupZoneId: 'z1', deliveryLat: 4, deliveryLng: 4 },
    ];
    const batches = groupOrdersIntoBatches(orders);
    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(3);
    expect(batches[1]).toHaveLength(1);
  });

  it('creates batch for rider deliveries', async () => {
    mockPrisma.deliveryBatch.findFirst.mockResolvedValue(null);
    mockPrisma.delivery.findMany.mockResolvedValue([
      {
        orderId: 'o1',
        deliveryLat: 28.6,
        deliveryLng: 77.2,
        order: { store: { locality: 'CP', id: 's1' } },
      },
      {
        orderId: 'o2',
        deliveryLat: 28.61,
        deliveryLng: 77.21,
        order: { store: { locality: 'CP', id: 's1' } },
      },
    ]);
    mockPrisma.deliveryBatch.create.mockResolvedValue({ id: 'b1', totalOrders: 2, items: [] });

    const batch = await service.createBatchesForRider('rider-1');
    expect(batch).toBeTruthy();
    expect(mockEvents.emit).toHaveBeenCalled();
  });
});
