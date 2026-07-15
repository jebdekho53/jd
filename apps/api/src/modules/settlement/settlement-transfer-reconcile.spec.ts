import { PayoutRequestStatus, PayoutTransactionStatus, SettlementLedgerStatus } from '@prisma/client';
import { SettlementService } from './settlement.service';
import { LEDGER_ACCOUNT_CODES } from '../finance/ledger-accounts.constants';

/**
 * Webhook reconciliation for merchant payouts: a Route transfer that fails after
 * the payout was marked COMPLETED must fully unwind — request back to APPROVED,
 * wallet credited back, settled entries un-earmarked, journal reversed.
 */

const TXN = {
  id: 'txn-1',
  payoutRequestId: 'pr-1',
  amount: 500,
  status: PayoutTransactionStatus.SUCCESS,
  payoutRequest: { merchantProfileId: 'mp-1' },
};

function harness(txn: Record<string, unknown> | null = TXN) {
  const tx = {
    payoutTransaction: { update: jest.fn().mockResolvedValue({}) },
    payoutRequest: { update: jest.fn().mockResolvedValue({}) },
    merchantPayout: { updateMany: jest.fn().mockResolvedValue({}) },
    merchantWallet: { update: jest.fn().mockResolvedValue({}) },
    settlementLedger: { updateMany: jest.fn().mockResolvedValue({}) },
  };
  const prisma = {
    payoutTransaction: { findFirst: jest.fn().mockResolvedValue(txn) },
    $transaction: (fn: (t: unknown) => Promise<unknown>) => fn(tx),
  } as never;
  const ledger = { postJournal: jest.fn().mockResolvedValue('jrn-rev') } as never;
  const audit = { log: jest.fn().mockResolvedValue(undefined) } as never;
  const financeCache = { invalidatePayouts: jest.fn() } as never;

  // Only prisma, ledger, audit, financeCache are exercised on this path.
  const svc = Object.create(SettlementService.prototype) as SettlementService;
  Object.assign(svc, { prisma, ledger, audit, financeCache, logger: { warn: jest.fn() } });
  return { svc, tx, prisma, ledger, audit };
}

const FAILED = { transferId: 'trf_9', status: 'reversed', failureReason: 'beneficiary bank rejected' };

describe('merchant payout — transfer failed reconciliation', () => {
  it('reverts request to APPROVED, fails the txn, and credits the wallet back', async () => {
    const { svc, tx } = harness();

    await svc.onTransferFailed(FAILED);

    expect(tx.payoutTransaction.update.mock.calls[0][0].data.status).toBe(PayoutTransactionStatus.FAILED);
    expect(tx.payoutRequest.update.mock.calls[0][0].data.status).toBe(PayoutRequestStatus.APPROVED);
    expect(tx.merchantPayout.updateMany.mock.calls[0][0].data.status).toBe('FAILED');
    expect(tx.merchantWallet.update.mock.calls[0][0].data.totalPaidOut).toEqual({ decrement: 500 });
  });

  it('un-earmarks the settled ledger entries so they can be paid again', async () => {
    const { svc, tx } = harness();
    await svc.onTransferFailed(FAILED);
    expect(tx.settlementLedger.updateMany.mock.calls[0][0]).toMatchObject({
      where: { payoutRequestId: 'pr-1' },
      data: { status: SettlementLedgerStatus.SETTLED, payoutRequestId: null },
    });
  });

  it('reverses the merchant payout journal (swap of the original lines)', async () => {
    const { svc, ledger } = harness();
    await svc.onTransferFailed(FAILED);

    const { lines, idempotencyKey } = (ledger as never as { postJournal: jest.Mock }).postJournal
      .mock.calls[0][0];
    expect(idempotencyKey).toBe('merchant-payout-reversal:pr-1');
    const by = Object.fromEntries(lines.map((l: never) => [l['accountCode'], l]));
    expect(by[LEDGER_ACCOUNT_CODES.CUSTOMER_RECEIVABLE].debit).toBe(500);
    expect(by[LEDGER_ACCOUNT_CODES.MERCHANT_PAYABLE].credit).toBe(500);
  });

  it('is a no-op for a transfer id that is not a merchant payout', async () => {
    const { svc, ledger } = harness(null);
    await svc.onTransferFailed(FAILED);
    expect((ledger as never as { postJournal: jest.Mock }).postJournal).not.toHaveBeenCalled();
  });
});
