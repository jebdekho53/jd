import { Test, TestingModule } from '@nestjs/testing';
import { AIProductAnalysisStatus } from '@prisma/client';
import { AdminAiProductUsageService } from './admin-ai-product-usage.service';
import { PrismaService } from '../../database/prisma.service';
import { MerchantAiWalletService } from '../product/merchant-ai-wallet.service';

const mockWallet = {
  getWalletStatsForAdmin: jest.fn().mockResolvedValue({
    totalRechargesPaise: 100000,
    outstandingBalancePaise: 50000,
  }),
};

const mockPrisma = {
  aIProductAnalysis: {
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  merchantAiWalletTransaction: {
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  merchantProfile: { findMany: jest.fn() },
};

describe('AdminAiProductUsageService', () => {
  let service: AdminAiProductUsageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAiProductUsageService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MerchantAiWalletService, useValue: mockWallet },
      ],
    }).compile();
    service = module.get(AdminAiProductUsageService);
    jest.clearAllMocks();
  });

  it('returns summary stats', async () => {
    mockPrisma.aIProductAnalysis.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(2);
    mockPrisma.merchantAiWalletTransaction.count.mockResolvedValue(1);
    mockPrisma.merchantAiWalletTransaction.aggregate
      .mockResolvedValueOnce({ _sum: { amountPaise: 900 }, _count: 6 })
      .mockResolvedValueOnce({ _sum: { amountPaise: 150 } });
    mockPrisma.aIProductAnalysis.groupBy.mockResolvedValue([
      { merchantProfileId: 'mp-1', _count: { id: 5 } },
    ]);
    mockPrisma.merchantProfile.findMany.mockResolvedValue([
      { id: 'mp-1', businessName: 'Test Store' },
    ]);

    const stats = await service.getStats();
    expect(stats.totalAnalyses).toBe(10);
    expect(stats.confirmedProducts).toBe(6);
    expect(stats.failedAnalyses).toBe(2);
    expect(stats.totalAiRevenuePaise).toBe(750);
    expect(stats.merchantWise[0].businessName).toBe('Test Store');
  });

  it('exports CSV', async () => {
    mockPrisma.aIProductAnalysis.findMany.mockResolvedValue([
      {
        id: 'a-1',
        confidence: 0.8,
        status: AIProductAnalysisStatus.CONFIRMED,
        chargeAmountPaise: 150,
        chargedAt: new Date('2026-01-01'),
        errorMessage: null,
        createdAt: new Date('2026-01-01'),
        merchantProfile: { businessName: 'Shop' },
        store: { name: 'Store 1' },
        createdProduct: { name: 'Milk' },
      },
    ]);

    const csv = await service.exportCsv();
    expect(csv).toContain('id,merchant,store');
    expect(csv).toContain('a-1');
    expect(csv).toContain('Milk');
  });
});
