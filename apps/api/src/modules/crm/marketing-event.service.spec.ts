import { MarketingEventService } from './marketing-event.service';
import { MarketingEventType } from '@prisma/client';

describe('MarketingEventService', () => {
  const prisma = {
    marketingEvent: { create: jest.fn() },
    customerAffinity: { upsert: jest.fn() },
  };
  const service = new MarketingEventService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('records marketing events', async () => {
    prisma.marketingEvent.create.mockResolvedValue({ id: 'e1' });
    const result = await service.track({
      userId: 'u1',
      eventType: MarketingEventType.SEARCH,
      metadata: { q: 'milk' },
    });
    expect(result.id).toBe('e1');
    expect(prisma.marketingEvent.create).toHaveBeenCalled();
  });

  it('updates product affinity on view', async () => {
    prisma.marketingEvent.create.mockResolvedValue({ id: 'e1' });
    prisma.customerAffinity.upsert.mockResolvedValue({});
    await service.track({
      userId: 'u1',
      eventType: MarketingEventType.VIEW_PRODUCT,
      productId: 'p1',
    });
    expect(prisma.customerAffinity.upsert).toHaveBeenCalled();
  });
});
