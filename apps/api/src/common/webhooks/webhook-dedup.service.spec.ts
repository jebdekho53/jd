import { Test, TestingModule } from '@nestjs/testing';
import { WebhookDedupService } from './webhook-dedup.service';
import { PrismaService } from '../../database/prisma.service';
import { WebhookEventStatus, WebhookProvider } from '@prisma/client';

const mockPrisma = {
  webhookEvent: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('WebhookDedupService', () => {
  let service: WebhookDedupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookDedupService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(WebhookDedupService);
    jest.clearAllMocks();
  });

  it('claims a new webhook event', async () => {
    mockPrisma.webhookEvent.create.mockResolvedValue({ id: 'wh-1' });
    const body = Buffer.from('{"event":"payment.captured"}');
    const result = await service.claimEvent(WebhookProvider.RAZORPAY, 'evt_1', body, 'sig');
    expect(result.action).toBe('process');
    if (result.action === 'process') expect(result.recordId).toBe('wh-1');
  });

  it('returns duplicate when unique constraint violated and already processed', async () => {
    mockPrisma.webhookEvent.create.mockRejectedValue({ code: 'P2002' });
    mockPrisma.webhookEvent.findUnique.mockResolvedValue({
      id: 'wh-dup',
      status: WebhookEventStatus.PROCESSED,
    });
    const result = await service.claimEvent(WebhookProvider.RAZORPAY, 'evt_dup', Buffer.from('{}'));
    expect(result.action).toBe('duplicate');
  });
});
