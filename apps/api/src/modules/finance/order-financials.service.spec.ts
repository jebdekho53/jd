import { Test, TestingModule } from '@nestjs/testing';
import { OrderFinancialsService } from './order-financials.service';
import { PrismaService } from '../../database/prisma.service';
import { FinanceCommissionService } from './finance-commission.service';
import { LedgerService } from './ledger.service';

const mockPrisma = {
  orderFinancialSnapshot: { findUnique: jest.fn() },
  order: { findFirst: jest.fn() },
};

const mockLedger = { recordOrderPayment: jest.fn() };
const mockCommission = { resolveCommissionPercent: jest.fn() };

describe('OrderFinancialsService merchant access', () => {
  let service: OrderFinancialsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderFinancialsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FinanceCommissionService, useValue: mockCommission },
        { provide: LedgerService, useValue: mockLedger },
      ],
    }).compile();
    service = module.get(OrderFinancialsService);
    jest.clearAllMocks();
  });

  it('returns null when merchant does not own the order', async () => {
    mockPrisma.order.findFirst.mockResolvedValue(null);
    const result = await service.getOrderFinancialsForMerchant('order-other', 'merchant-user-1');
    expect(result).toBeNull();
    expect(mockPrisma.orderFinancialSnapshot.findUnique).not.toHaveBeenCalled();
  });

  it('returns financials when merchant owns the order', async () => {
    mockPrisma.order.findFirst.mockResolvedValue({ id: 'order-1' });
    mockPrisma.orderFinancialSnapshot.findUnique.mockResolvedValue({
      orderId: 'order-1',
      subtotal: { toNumber: () => 100 },
      discountAmount: { toNumber: () => 0 },
      offerSubsidy: { toNumber: () => 0 },
      merchantContribution: { toNumber: () => 0 },
      platformContribution: { toNumber: () => 0 },
      deliveryFee: { toNumber: () => 10 },
      taxAmount: { toNumber: () => 5 },
      commissionPercent: { toNumber: () => 10 },
      commissionAmount: { toNumber: () => 10 },
      netMerchantEarnings: { toNumber: () => 95 },
      netPlatformEarnings: { toNumber: () => 10 },
      riderPayoutAmount: { toNumber: () => 7 },
      frozenAt: new Date('2026-01-01'),
      storeSnapshot: {},
    });

    const result = await service.getOrderFinancialsForMerchant('order-1', 'merchant-user-1');
    expect(result?.orderId).toBe('order-1');
    expect(result?.netMerchantEarnings).toBe(95);
  });
});
