import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  MerchantAiCreditTransactionStatus,
  MerchantAiCreditTransactionType,
} from '@prisma/client';
import { ConflictException } from '@nestjs/common';
import { MerchantAiBillingService } from './merchant-ai-billing.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  merchantAiCreditTransaction: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  aIProductAnalysis: { count: jest.fn(), updateMany: jest.fn() },
};

describe('MerchantAiBillingService', () => {
  let service: MerchantAiBillingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantAiBillingService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((k: string, d?: unknown) => (k === 'AI_PRODUCT_ANALYSIS_PRICE_PAISE' ? 150 : d)) },
        },
      ],
    }).compile();
    service = module.get(MerchantAiBillingService);
    jest.clearAllMocks();
  });

  it('builds idempotency key', () => {
    expect(service.buildCreateProductIdempotencyKey('mp', 's', 'a')).toBe('mp:s:a:CREATE_PRODUCT');
  });

  it('charges on first confirm', async () => {
    mockPrisma.merchantAiCreditTransaction.findUnique.mockResolvedValue(null);
    mockPrisma.merchantAiCreditTransaction.create.mockResolvedValue({
      id: 'tx-1',
      amountPaise: 150,
    });

    const result = await service.chargeForProductCreation('mp', 's', 'a');
    expect(result.charged).toBe(true);
    expect(result.amountPaise).toBe(150);
    expect(mockPrisma.merchantAiCreditTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: MerchantAiCreditTransactionType.DEBIT,
          status: MerchantAiCreditTransactionStatus.SUCCESS,
          idempotencyKey: 'mp:s:a:CREATE_PRODUCT',
        }),
      }),
    );
  });

  it('does not double charge', async () => {
    mockPrisma.merchantAiCreditTransaction.findUnique.mockResolvedValue({
      id: 'tx-1',
      amountPaise: 150,
      status: MerchantAiCreditTransactionStatus.SUCCESS,
    });

    const result = await service.chargeForProductCreation('mp', 's', 'a');
    expect(result.charged).toBe(false);
    expect(mockPrisma.merchantAiCreditTransaction.create).not.toHaveBeenCalled();
  });

  it('refunds after product creation failure', async () => {
    mockPrisma.merchantAiCreditTransaction.findUnique
      .mockResolvedValueOnce({
        id: 'tx-1',
        amountPaise: 150,
        status: MerchantAiCreditTransactionStatus.SUCCESS,
      })
      .mockResolvedValueOnce(null);

    await service.refundOnProductCreationFailure('mp', 's', 'a', 'create failed');

    expect(mockPrisma.merchantAiCreditTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: MerchantAiCreditTransactionType.REFUND,
          status: MerchantAiCreditTransactionStatus.REFUNDED,
        }),
      }),
    );
    expect(mockPrisma.aIProductAnalysis.updateMany).toHaveBeenCalledWith({
      where: { id: 'a' },
      data: { chargedAt: null },
    });
  });

  it('enforces daily analysis limit', async () => {
    mockPrisma.aIProductAnalysis.count.mockResolvedValue(20);
    await expect(service.assertDailyAnalysisLimit('mp')).rejects.toThrow(ConflictException);
  });
});
