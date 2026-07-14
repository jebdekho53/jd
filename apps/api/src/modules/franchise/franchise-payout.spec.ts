import { BadRequestException } from '@nestjs/common';
import { FranchisePayoutStatus, FranchiseSettlementStatus } from '@prisma/client';
import { computeFranchiseTax } from './franchise-tax.util';
import { computeFranchiseShare } from './expansion.util';
import { FranchisePayoutService } from './franchise-payout.service';
import { LEDGER_ACCOUNT_CODES } from '../finance/ledger-accounts.constants';

// ---------------------------------------------------------------------------
// Tax math — the locked business rule, end to end.
// ---------------------------------------------------------------------------

describe('franchise tax — commission-of-commission then GST/TDS', () => {
  it('₹1000 order @12% platform commission → ₹12 franchise share', () => {
    const commissionBase = 1000 * 0.12; // ₹120, frozen on OrderFinancialSnapshot
    const { franchiseShare } = computeFranchiseShare(commissionBase, 10);
    expect(franchiseShare).toBe(12);
  });

  it('GST-registered partner: ₹12 → GST ₹2.16, TDS ₹0.60, net ₹13.56', () => {
    const tax = computeFranchiseTax({ franchiseShare: 12, gstRegistered: true, panVerified: true });

    expect(tax.gstPercent).toBe(18);
    expect(tax.gstAmount).toBe(2.16);
    expect(tax.tdsPercent).toBe(5);
    expect(tax.tdsAmount).toBe(0.6);
    expect(tax.netPayable).toBe(13.56); // 12 + 2.16 − 0.60
  });

  it('unregistered partner: no GST → net ₹11.40', () => {
    const tax = computeFranchiseTax({ franchiseShare: 12, gstRegistered: false, panVerified: true });

    expect(tax.gstPercent).toBe(0);
    expect(tax.gstAmount).toBe(0);
    expect(tax.tdsAmount).toBe(0.6);
    expect(tax.netPayable).toBe(11.4); // 12 − 0.60
  });

  it('TDS is charged on the commission only, never on the GST', () => {
    const tax = computeFranchiseTax({ franchiseShare: 100, gstRegistered: true, panVerified: true });
    // 5% of 100, NOT 5% of 118.
    expect(tax.tdsAmount).toBe(5);
    expect(tax.netPayable).toBe(113); // 100 + 18 − 5
  });

  it('zero share pays zero tax and zero net — no negative payouts', () => {
    const tax = computeFranchiseTax({ franchiseShare: 0, gstRegistered: true, panVerified: true });
    expect(tax).toMatchObject({ gstAmount: 0, tdsAmount: 0, netPayable: 0 });
  });
});

// ---------------------------------------------------------------------------
// Payout
// ---------------------------------------------------------------------------

const VERIFIED_BANK = {
  accountHolderName: 'Rahul Seth',
  accountNumber: '50100123456789',
  ifsc: 'HDFC0001234',
  bankName: 'HDFC Bank',
  verified: true,
  razorpayLinkedAccountId: 'acc_route123',
};

const SETTLEMENT = {
  id: 'stl-1',
  franchiseId: 'fr-1',
  status: FranchiseSettlementStatus.PROCESSING,
  franchiseShare: 12,
  gstAmount: 2.16,
  tdsAmount: 0.6,
  netPayable: 13.56,
  periodStart: new Date('2026-06-01'),
  periodEnd: new Date('2026-06-30'),
  payout: null as unknown,
  franchise: { bankAccount: VERIFIED_BANK },
};

function harness(overrides: {
  settlement?: Record<string, unknown>;
  transfer?: jest.Mock;
} = {}) {
  const tx = {
    franchisePayout: { update: jest.fn().mockResolvedValue({ id: 'po-1' }) },
    franchiseSettlement: { update: jest.fn().mockResolvedValue({}) },
  };
  const payoutUpdate = jest.fn().mockResolvedValue({});
  const prisma = {
    franchiseSettlement: {
      findUnique: jest.fn().mockResolvedValue({ ...SETTLEMENT, ...overrides.settlement }),
    },
    franchisePayout: {
      upsert: jest.fn().mockResolvedValue({ id: 'po-1' }),
      update: payoutUpdate,
      findMany: jest.fn(),
    },
    $transaction: (fn: (t: unknown) => Promise<unknown>) => fn(tx),
  } as never;

  const ledger = { postJournal: jest.fn().mockResolvedValue('jrn-1') } as never;
  const razorpay = {
    createTransfer:
      overrides.transfer ??
      jest.fn().mockResolvedValue({ id: 'trf_1', status: 'processed', amount: 1356 }),
  } as never;

  // KYC gate passes by default; the blocked cases override it.
  const kyc = { assertPayoutAllowed: jest.fn().mockResolvedValue(undefined) } as never;
  const notifications = {
    payoutCompleted: jest.fn().mockResolvedValue(undefined),
    payoutFailed: jest.fn().mockResolvedValue(undefined),
  } as never;

  return {
    svc: new FranchisePayoutService(prisma, ledger, razorpay, kyc, notifications),
    notifications,
    kyc,
    prisma,
    tx,
    ledger,
    razorpay,
    payoutUpdate,
  };
}

describe('payoutSettlement — happy path', () => {
  it('transfers the NET amount (after TDS), not the gross', async () => {
    const { svc, razorpay } = harness();

    await svc.payoutSettlement('admin-1', 'stl-1');

    const call = (razorpay as never as { createTransfer: jest.Mock }).createTransfer.mock.calls[0][0];
    expect(call.amountRupees).toBe(13.56);
    expect(call.linkedAccountId).toBe('acc_route123');
  });

  it('marks the settlement PAID only after the transfer succeeds', async () => {
    const { svc, tx } = harness();

    await svc.payoutSettlement('admin-1', 'stl-1');

    expect(tx.franchiseSettlement.update.mock.calls[0][0].data).toMatchObject({
      status: FranchiseSettlementStatus.PAID,
    });
    expect(tx.franchisePayout.update.mock.calls[0][0].data).toMatchObject({
      status: FranchisePayoutStatus.COMPLETED,
      razorpayTransferId: 'trf_1',
    });
  });

  it('books TDS as a liability we owe the government, not as partner money', async () => {
    const { svc, ledger } = harness();

    await svc.payoutSettlement('admin-1', 'stl-1');

    const { lines } = (ledger as never as { postJournal: jest.Mock }).postJournal.mock.calls[0][0];
    const byAccount = Object.fromEntries(lines.map((l: never) => [l['accountCode'], l]));

    // We owed share + GST; TDS is withheld and re-booked as TDS_PAYABLE.
    expect(byAccount[LEDGER_ACCOUNT_CODES.FRANCHISE_PAYABLE].debit).toBeCloseTo(14.16);
    expect(byAccount[LEDGER_ACCOUNT_CODES.TDS_PAYABLE].credit).toBeCloseTo(0.6);
    expect(byAccount[LEDGER_ACCOUNT_CODES.PLATFORM_ESCROW].credit).toBeCloseTo(13.56);

    // Double-entry must balance.
    const debits = lines.reduce((s: number, l: { debit: number }) => s + l.debit, 0);
    const credits = lines.reduce((s: number, l: { credit: number }) => s + l.credit, 0);
    expect(debits).toBeCloseTo(credits);
  });

  it('stores only the last 4 digits of the account number in the payout snapshot', async () => {
    const { svc, prisma } = harness();

    await svc.payoutSettlement('admin-1', 'stl-1');

    const snap = (prisma as never as { franchisePayout: { upsert: jest.Mock } }).franchisePayout
      .upsert.mock.calls[0][0].create.bankSnapshot;
    expect(snap.accountNumberLast4).toBe('6789');
    expect(JSON.stringify(snap)).not.toContain('50100123456789');
  });
});

describe('payoutSettlement — money safety', () => {
  it('IDEMPOTENT: an already-completed payout is returned, not sent again', async () => {
    const { svc, razorpay } = harness({
      settlement: {
        payout: { id: 'po-1', status: FranchisePayoutStatus.COMPLETED },
      },
    });

    const res = await svc.payoutSettlement('admin-1', 'stl-1');

    expect(res).toMatchObject({ id: 'po-1' });
    expect((razorpay as never as { createTransfer: jest.Mock }).createTransfer)
      .not.toHaveBeenCalled();
  });

  it('refuses to pay a settlement that is already PAID', async () => {
    const { svc } = harness({ settlement: { status: FranchiseSettlementStatus.PAID } });
    await expect(svc.payoutSettlement('admin-1', 'stl-1')).rejects.toThrow(/already paid/i);
  });

  it('refuses to pay into an UNVERIFIED bank account', async () => {
    const { svc, razorpay } = harness({
      settlement: { franchise: { bankAccount: { ...VERIFIED_BANK, verified: false } } },
    });

    await expect(svc.payoutSettlement('admin-1', 'stl-1')).rejects.toThrow(/not verified/i);
    expect((razorpay as never as { createTransfer: jest.Mock }).createTransfer)
      .not.toHaveBeenCalled();
  });

  it('refuses when the partner has no bank account at all', async () => {
    const { svc } = harness({ settlement: { franchise: { bankAccount: null } } });
    await expect(svc.payoutSettlement('admin-1', 'stl-1')).rejects.toThrow(/no bank account/i);
  });

  it('refuses a zero/negative net payable', async () => {
    const { svc } = harness({ settlement: { netPayable: 0 } });
    await expect(svc.payoutSettlement('admin-1', 'stl-1')).rejects.toThrow(/nothing to pay/i);
  });

  it('a Razorpay failure leaves the settlement UNPAID and the payout retryable', async () => {
    const { svc, tx, payoutUpdate } = harness({
      transfer: jest.fn().mockRejectedValue(new Error('insufficient balance')),
    });

    await expect(svc.payoutSettlement('admin-1', 'stl-1')).rejects.toThrow(BadRequestException);

    // Critically: the settlement was NOT marked paid. Doing so would rob the
    // partner of money they are still owed.
    expect(tx.franchiseSettlement.update).not.toHaveBeenCalled();
    expect(payoutUpdate.mock.calls[0][0].data).toMatchObject({
      status: FranchisePayoutStatus.FAILED,
      failureReason: 'insufficient balance',
    });
  });

  it('does not post a ledger journal when the transfer failed', async () => {
    const { svc, ledger } = harness({
      transfer: jest.fn().mockRejectedValue(new Error('gateway down')),
    });

    await expect(svc.payoutSettlement('admin-1', 'stl-1')).rejects.toThrow();
    expect((ledger as never as { postJournal: jest.Mock }).postJournal).not.toHaveBeenCalled();
  });
});
