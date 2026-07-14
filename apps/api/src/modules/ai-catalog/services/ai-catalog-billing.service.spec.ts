import { MerchantAiWalletTransactionStatus } from '@prisma/client';
import { AiCatalogBillingService } from './ai-catalog-billing.service';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AiCatalogConfigService } from './ai-catalog-config.service';

function makeService(overrides: { existingDebit?: unknown; existingRefund?: unknown } = {}) {
  const audit = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;
  const config = {
    priceForOutput: jest.fn().mockResolvedValue(150),
    pricing: jest.fn().mockResolvedValue({ analysisPaise: 150, perOutputPaise: {} }),
  } as unknown as AiCatalogConfigService;
  const txCreate = jest.fn().mockResolvedValue({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma: any = {
    merchantAiWallet: {
      upsert: jest.fn().mockResolvedValue({ balancePaise: 10_000 }),
      findUnique: jest.fn().mockResolvedValue({ balancePaise: 10_000 }),
      update: jest.fn().mockResolvedValue({ balancePaise: 9_850 }),
    },
    merchantAiWalletTransaction: {
      findUnique: jest.fn((args: { where: { idempotencyKey: string } }) =>
        Promise.resolve(
          args.where.idempotencyKey.includes('refund') ? overrides.existingRefund ?? null : overrides.existingDebit ?? null,
        ),
      ),
      create: txCreate,
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>): Promise<unknown> => fn(txCtx)),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txCtx: any = {
    merchantAiWallet: prisma.merchantAiWallet,
    merchantAiWalletTransaction: prisma.merchantAiWalletTransaction,
  };
  return { svc: new AiCatalogBillingService(prisma as unknown as PrismaService, audit, config), prisma, txCreate };
}

const debitParams = {
  merchantProfileId: 'm1', storeId: 's1', analysisId: 'a1', imageAssetId: 'img1',
  outputType: 'main', userId: 'u1',
};

describe('AiCatalogBillingService', () => {
  it('charges once for a fresh image and debits the wallet', async () => {
    const { svc } = makeService();
    const res = await svc.debitForImage(debitParams);
    expect(res.charged).toBe(true);
    expect(res.amountPaise).toBe(150);
  });

  it('is idempotent: an already-SUCCESS debit for the same asset does not charge again', async () => {
    const { svc, txCreate } = makeService({ existingDebit: { status: MerchantAiWalletTransactionStatus.SUCCESS } });
    const res = await svc.debitForImage(debitParams);
    expect(res.charged).toBe(false);
    expect(res.amountPaise).toBe(0);
    expect(txCreate).not.toHaveBeenCalled();
  });

  it('refund is a no-op when there was never a successful debit', async () => {
    const { svc, prisma } = makeService({ existingDebit: null });
    await svc.refundForImage({ merchantProfileId: 'm1', imageAssetId: 'img1', reason: 'failed' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('refund is idempotent when a refund already exists', async () => {
    const { svc, prisma } = makeService({
      existingDebit: { status: MerchantAiWalletTransactionStatus.SUCCESS, amountPaise: 150, storeId: 's1', analysisId: 'a1' },
      existingRefund: { id: 'r1' },
    });
    await svc.refundForImage({ merchantProfileId: 'm1', imageAssetId: 'img1', reason: 'failed' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
