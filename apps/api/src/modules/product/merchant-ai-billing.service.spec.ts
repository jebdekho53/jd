import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MerchantAiBillingService } from './merchant-ai-billing.service';
import { PrismaService } from '../../database/prisma.service';
import { MerchantAiWalletService } from './merchant-ai-wallet.service';

const mockWallet = {
  getProductCostPaise: jest.fn().mockReturnValue(150),
  getMinRechargePaise: jest.fn().mockReturnValue(10000),
  buildDebitIdempotencyKey: jest.fn().mockReturnValue('key'),
  debitForProductCreation: jest.fn(),
  refundOnProductCreationFailure: jest.fn(),
};

const mockPrisma = {
  aIProductAnalysis: { count: jest.fn() },
};

describe('MerchantAiBillingService', () => {
  let service: MerchantAiBillingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantAiBillingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MerchantAiWalletService, useValue: mockWallet },
        { provide: ConfigService, useValue: { get: jest.fn((_, d) => d) } },
      ],
    }).compile();
    service = module.get(MerchantAiBillingService);
    jest.clearAllMocks();
  });

  it('delegates charge to wallet service', async () => {
    mockWallet.debitForProductCreation.mockResolvedValue({
      charged: true,
      amountPaise: 150,
      transactionId: 'tx1',
    });
    const result = await service.chargeForProductCreation('mp1', 's1', 'a1', 'u1');
    expect(mockWallet.debitForProductCreation).toHaveBeenCalledWith('mp1', 's1', 'a1', 'u1', undefined);
    expect(result.amountPaise).toBe(150);
  });
});
