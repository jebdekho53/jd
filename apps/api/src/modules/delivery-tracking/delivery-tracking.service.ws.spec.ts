import { ForbiddenException } from '@nestjs/common';
import { DeliveryTrackingService } from './delivery-tracking.service';

describe('DeliveryTrackingService.assertSubscribeAccess', () => {
  const mockPrisma = {
    buyerProfile: { findUnique: jest.fn() },
    store: { findMany: jest.fn() },
    order: { findFirst: jest.fn(), findUnique: jest.fn() },
    riderProfile: { findUnique: jest.fn() },
    delivery: { findFirst: jest.fn() },
  };

  const service = new DeliveryTrackingService(
    mockPrisma as never,
    { emit: jest.fn() } as never,
    {} as never,
    {} as never,
  );

  const buyerUser = {
    id: 'user-1',
    phone: '',
    email: null,
    roles: ['BUYER'],
    permissions: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows buyer subscribed to own order', async () => {
    mockPrisma.buyerProfile.findUnique.mockResolvedValue({ id: 'bp-1' });
    mockPrisma.order.findFirst.mockResolvedValue({ id: 'ord-1' });

    await expect(
      service.assertSubscribeAccess(buyerUser, {
        namespace: 'buyer',
        id: 'ord-1',
        orderId: 'ord-1',
      }),
    ).resolves.toBeUndefined();
  });

  it('denies buyer for another users order', async () => {
    mockPrisma.buyerProfile.findUnique.mockResolvedValue({ id: 'bp-1' });
    mockPrisma.order.findFirst.mockResolvedValue(null);

    await expect(
      service.assertSubscribeAccess(buyerUser, {
        namespace: 'buyer',
        id: 'ord-other',
        orderId: 'ord-other',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('denies non-admin on admin namespace', async () => {
    await expect(
      service.assertSubscribeAccess(buyerUser, {
        namespace: 'admin',
        id: 'fleet',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows admin fleet subscription', async () => {
    await expect(
      service.assertSubscribeAccess(
        { ...buyerUser, roles: ['ADMIN'] },
        { namespace: 'admin', id: 'fleet' },
      ),
    ).resolves.toBeUndefined();
  });
});
