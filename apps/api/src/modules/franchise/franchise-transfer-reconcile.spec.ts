import { FranchisePayoutStatus, FranchiseSettlementStatus } from '@prisma/client';
import { FranchisePayoutService } from './franchise-payout.service';
import { LEDGER_ACCOUNT_CODES } from '../finance/ledger-accounts.constants';

/**
 * Webhook reconciliation: a Route transfer that FAILS after we optimistically
 * marked the franchise payout COMPLETED must be reversed — otherwise the partner
 * shows as paid for money that never left, and the ledger lies.
 */

const COMPLETED_PAYOUT = {
  id: 'po-1',
  franchiseId: 'fr-1',
  settlementId: 'stl-1',
  status: FranchisePayoutStatus.COMPLETED,
  netAmount: 13.56,
  tdsAmount: 0.6,
  settlement: { id: 'stl-1', franchiseShare: 12, gstAmount: 2.16 },
};

function harness(payout: Record<string, unknown> | null = COMPLETED_PAYOUT) {
  const tx = {
    franchisePayout: { update: jest.fn().mockResolvedValue({}) },
    franchiseSettlement: { update: jest.fn().mockResolvedValue({}) },
  };
  const prisma = {
    franchisePayout: { findUnique: jest.fn().mockResolvedValue(payout) },
    $transaction: (fn: (t: unknown) => Promise<unknown>) => fn(tx),
  } as never;
  const ledger = { postJournal: jest.fn().mockResolvedValue('jrn-rev') } as never;
  const notifications = { payoutFailed: jest.fn().mockResolvedValue(undefined) } as never;

  const svc = new FranchisePayoutService(
    prisma,
    ledger,
    {} as never, // razorpay unused on this path
    {} as never, // kyc unused
    notifications,
  );
  return { svc, tx, prisma, ledger, notifications };
}

const FAILED_EVENT = { transferId: 'trf_1', status: 'failed', failureReason: 'account frozen' };

describe('franchise payout — transfer failed reconciliation', () => {
  it('reverses the payout to FAILED and the settlement back to unpaid (retryable)', async () => {
    const { svc, tx } = harness();

    await svc.onTransferFailed(FAILED_EVENT);

    expect(tx.franchisePayout.update.mock.calls[0][0].data.status).toBe(FranchisePayoutStatus.FAILED);
    expect(tx.franchiseSettlement.update.mock.calls[0][0].data).toMatchObject({
      status: FranchiseSettlementStatus.PROCESSING,
      paidAt: null,
    });
  });

  it('posts a REVERSING ledger journal — escrow back, payable re-owed, TDS undone', async () => {
    const { svc, ledger } = harness();

    await svc.onTransferFailed(FAILED_EVENT);

    const { lines, idempotencyKey } = (ledger as never as { postJournal: jest.Mock }).postJournal
      .mock.calls[0][0];
    expect(idempotencyKey).toBe('franchise-payout-reversal:po-1');
    const by = Object.fromEntries(lines.map((l: never) => [l['accountCode'], l]));
    expect(by[LEDGER_ACCOUNT_CODES.PLATFORM_ESCROW].debit).toBeCloseTo(13.56);
    expect(by[LEDGER_ACCOUNT_CODES.TDS_PAYABLE].debit).toBeCloseTo(0.6);
    expect(by[LEDGER_ACCOUNT_CODES.FRANCHISE_PAYABLE].credit).toBeCloseTo(14.16);
    // Reversal must itself balance.
    const d = lines.reduce((s: number, l: { debit: number }) => s + l.debit, 0);
    const c = lines.reduce((s: number, l: { credit: number }) => s + l.credit, 0);
    expect(d).toBeCloseTo(c);
  });

  it('tells the partner the payout failed', async () => {
    const { svc, notifications } = harness();
    await svc.onTransferFailed(FAILED_EVENT);
    expect((notifications as never as { payoutFailed: jest.Mock }).payoutFailed)
      .toHaveBeenCalledWith('fr-1', 13.56, 'account frozen');
  });

  it('is a no-op for an unknown transfer id', async () => {
    const { svc, tx, ledger } = harness(null);
    await svc.onTransferFailed(FAILED_EVENT);
    expect(tx.franchisePayout.update).not.toHaveBeenCalled();
    expect((ledger as never as { postJournal: jest.Mock }).postJournal).not.toHaveBeenCalled();
  });

  it('is a no-op when the payout is not COMPLETED (idempotent against double-fire)', async () => {
    const { svc, tx } = harness({ ...COMPLETED_PAYOUT, status: FranchisePayoutStatus.FAILED });
    await svc.onTransferFailed(FAILED_EVENT);
    expect(tx.franchisePayout.update).not.toHaveBeenCalled();
  });
});
