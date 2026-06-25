import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DeliveryTrackingService } from './delivery-tracking.service';
import { DeliveryTrackingCacheService } from './delivery-tracking-cache.service';
import { OrderCacheService } from '../order/order-cache.service';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatus, DeliveryStatus } from '@prisma/client';

describe('DeliveryTrackingService', () => {
  let service: DeliveryTrackingService;
  const prisma = {
    riderProfile: { findUnique: jest.fn(), findMany: jest.fn(), groupBy: jest.fn() },
    delivery: { findFirst: jest.fn(), update: jest.fn(), findMany: jest.fn(), groupBy: jest.fn() },
    deliveryTracking: { create: jest.fn(), findMany: jest.fn(), deleteMany: jest.fn(), count: jest.fn(), findFirst: jest.fn() },
    order: { findFirst: jest.fn(), findUnique: jest.fn(), count: jest.fn() },
    buyerProfile: { findUnique: jest.fn() },
    store: { findMany: jest.fn() },
  };
  const events = { emit: jest.fn() };
  const trackingCache = {
    invalidateTracking: jest.fn(),
    invalidateFleet: jest.fn(),
    getTracking: jest.fn(),
    setTracking: jest.fn(),
  };
  const orderCache = { invalidate: jest.fn(), invalidateAll: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryTrackingService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: events },
        { provide: DeliveryTrackingCacheService, useValue: trackingCache },
        { provide: OrderCacheService, useValue: orderCache },
      ],
    }).compile();
    service = module.get(DeliveryTrackingService);
  });

  it('processes rider location and emits websocket events', async () => {
    prisma.riderProfile.findUnique.mockResolvedValue({ status: 'ON_DELIVERY', user: { status: 'ACTIVE' } });
    prisma.delivery.findFirst.mockResolvedValue({
      id: 'd1',
      orderId: 'o1',
      status: DeliveryStatus.ACCEPTED,
      pickedUpAt: null,
      order: {
        id: 'o1',
        orderNumber: 'JD-1',
        status: OrderStatus.RIDER_ASSIGNED,
        storeId: 's1',
        deliveryLat: 28.62,
        deliveryLng: 77.22,
        store: { latitude: 28.61, longitude: 77.21, name: 'Store' },
      },
    });
    prisma.deliveryTracking.create.mockResolvedValue({});
    prisma.delivery.update.mockResolvedValue({});

    await service.processRiderLocation('r1', {
      latitude: 28.615,
      longitude: 77.215,
      heading: 90,
      speed: 12,
    });

    expect(prisma.deliveryTracking.create).toHaveBeenCalled();
    expect(orderCache.invalidate).toHaveBeenCalledWith('o1');
    expect(events.emit).toHaveBeenCalledWith(
      'ws.rider.location.updated',
      expect.objectContaining({ orderId: 'o1', riderProfileId: 'r1' }),
    );
  });

  it('skips tracking when rider is offline', async () => {
    prisma.riderProfile.findUnique.mockResolvedValue({ status: 'OFFLINE', user: { status: 'ACTIVE' } });
    await service.processRiderLocation('r1', { latitude: 1, longitude: 1 });
    expect(prisma.deliveryTracking.create).not.toHaveBeenCalled();
  });
});
