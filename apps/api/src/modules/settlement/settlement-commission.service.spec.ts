import { SettlementConfigScope } from '@prisma/client';
import { SettlementCommissionService } from './settlement-commission.service';
import { PrismaService } from '../../database/prisma.service';

describe('SettlementCommissionService', () => {
  const prisma = {
    settlementConfig: { findFirst: jest.fn() },
    orderItem: { findMany: jest.fn() },
  } as unknown as PrismaService;

  const service = new SettlementCommissionService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('returns merchant override when configured', async () => {
    (prisma.settlementConfig.findFirst as jest.Mock).mockResolvedValueOnce({
      commissionPercent: { toNumber: () => 10 },
      settlementDelayDays: 3,
    });

    const result = await service.resolveForOrder('merchant-1', 'order-1');
    expect(result).toEqual({ commissionPercent: 10, settlementDelayDays: 3 });
    expect(prisma.settlementConfig.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ scope: SettlementConfigScope.MERCHANT }),
      }),
    );
  });

  it('falls back to global default', async () => {
    (prisma.settlementConfig.findFirst as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    (prisma.orderItem.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.settlementConfig.findFirst as jest.Mock).mockResolvedValueOnce({
      commissionPercent: { toNumber: () => 15 },
      settlementDelayDays: 2,
    });

    const result = await service.resolveForOrder('merchant-1', 'order-1');
    expect(result.commissionPercent).toBe(15);
    expect(result.settlementDelayDays).toBe(2);
  });
});
