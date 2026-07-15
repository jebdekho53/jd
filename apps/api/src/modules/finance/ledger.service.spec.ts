import { LedgerReferenceType } from '@prisma/client';
import { LedgerService } from './ledger.service';

describe('LedgerService', () => {
  const prisma = {
    ledgerJournal: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'j1' }),
    },
    ledgerEntry: { create: jest.fn() },
    ledgerAccount: {
      // onModuleInit -> seedAccounts upserts the chart of accounts on boot. Without
      // this the rejection from `void svc.onModuleInit()` went unhandled and crashed
      // the whole jest worker, swallowing the run summary.
      upsert: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([
        { id: 'a1', code: 'PLATFORM_ESCROW' },
        { id: 'a2', code: 'CUSTOMER_RECEIVABLE' },
      ]),
    },
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        ledgerJournal: { create: jest.fn().mockResolvedValue({ id: 'j1' }) },
        ledgerEntry: { create: jest.fn() },
      }),
    ),
  };

  const svc = new LedgerService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    void svc.onModuleInit();
  });

  it('rejects unbalanced journals', async () => {
    await expect(
      svc.postJournal({
        referenceType: LedgerReferenceType.ADJUSTMENT,
        referenceId: 'x',
        description: 'bad',
        idempotencyKey: 'k1',
        lines: [
          { accountCode: 'PLATFORM_ESCROW', debit: 100, credit: 0 },
          { accountCode: 'CUSTOMER_RECEIVABLE', debit: 0, credit: 50 },
        ],
      }),
    ).rejects.toThrow('Unbalanced journal');
  });

  it('is idempotent by idempotencyKey', async () => {
    prisma.ledgerJournal.findUnique.mockResolvedValueOnce({ id: 'existing' });
    const id = await svc.postJournal({
      referenceType: LedgerReferenceType.ORDER_PAYMENT,
      referenceId: 'o1',
      description: 'pay',
      idempotencyKey: 'order-payment:o1',
      lines: [
        { accountCode: 'CUSTOMER_RECEIVABLE', debit: 100, credit: 0 },
        { accountCode: 'PLATFORM_ESCROW', debit: 0, credit: 100 },
      ],
    });
    expect(id).toBe('existing');
  });
});
