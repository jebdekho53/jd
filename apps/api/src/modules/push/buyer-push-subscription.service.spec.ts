import { PushDeviceType } from '@prisma/client';
import { BuyerPushSubscriptionService } from './buyer-push-subscription.service';

const mockPrisma = {
  pushSubscription: {
    count: jest.fn(),
    upsert: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockWebPush = {
  isConfigured: jest.fn().mockReturnValue(true),
  getPublicKey: jest.fn().mockReturnValue('test-public-key'),
};

describe('BuyerPushSubscriptionService', () => {
  let service: BuyerPushSubscriptionService;

  beforeEach(() => {
    service = new BuyerPushSubscriptionService(mockPrisma as never, mockWebPush as never);
    jest.clearAllMocks();
    mockPrisma.pushSubscription.count.mockResolvedValue(1);
    mockPrisma.pushSubscription.upsert.mockResolvedValue({
      id: 'sub-1',
      endpoint: 'https://push.example/1',
      isActive: true,
    });
    mockPrisma.pushSubscription.updateMany.mockResolvedValue({ count: 1 });
  });

  it('returns push status with public key', async () => {
    const status = await service.getPushStatus('u-1');
    expect(status.configured).toBe(true);
    expect(status.publicKey).toBe('test-public-key');
    expect(status.subscribed).toBe(true);
  });

  it('upserts subscription by endpoint', async () => {
    await service.subscribe('u-1', {
      endpoint: 'https://push.example/1',
      p256dh: 'key',
      auth: 'auth',
      deviceType: PushDeviceType.ANDROID,
    });
    expect(mockPrisma.pushSubscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { endpoint: 'https://push.example/1' },
        update: expect.objectContaining({ userId: 'u-1', isActive: true }),
      }),
    );
  });

  it('deactivates subscription on unsubscribe', async () => {
    const result = await service.unsubscribe('u-1', { endpoint: 'https://push.example/1' });
    expect(result.updated).toBe(1);
    expect(mockPrisma.pushSubscription.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u-1', endpoint: 'https://push.example/1' },
      data: { isActive: false },
    });
  });
});
