import { FranchiseSettlementService } from './franchise-settlement.service';
import { FranchisePayoutService } from './franchise-payout.service';
import { LEDGER_ACCOUNT_CODES } from '../finance/ledger-accounts.constants';

/**
 * Regression: FRANCHISE_PAYABLE must not drift.
 *
 * The settlement journal used to credit FRANCHISE_PAYABLE with only the partner's
 * share, while the payout journal debited share + GST. Each journal balanced on its
 * own — so the double-entry check passed — but the payable account went negative by
 * the GST on every single settlement, because the GST liability was never booked.
 */

type Line = { accountCode: string; debit: number; credit: number };

const SHARE = 12;
const GST = 2.16;
const TDS = 0.6;
const NET = 13.56;

async function settlementLines(): Promise<Line[]> {
  const postJournal = jest.fn().mockResolvedValue('jrn-1');
  const prisma = {
    franchiseSettlement: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'stl-1' }),
      update: jest.fn().mockResolvedValue({}),
    },
    franchisePartner: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'fr-1',
        businessName: 'Test',
        commissionPercent: 10,
        gstin: '09AAACH7409R1ZZ', // GST-registered
        stores: [{ storeId: 'store-1' }],
        documents: [{ id: 'doc-pan' }], // PAN verified -> 5% TDS
      }),
    },
    order: { aggregate: jest.fn().mockResolvedValue({ _sum: { totalAmount: 1000 } }) },
    orderFinancialSnapshot: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { commissionAmount: 120 } }),
    },
    franchiseAudit: { create: jest.fn().mockResolvedValue({}) },
  } as never;

  const svc = new FranchiseSettlementService(prisma, { postJournal } as never);
  await svc.createSettlement('fr-1', new Date('2026-06-01'), new Date('2026-06-30'));
  return postJournal.mock.calls[0][0].lines as Line[];
}

async function payoutLines(): Promise<Line[]> {
  const postJournal = jest.fn().mockResolvedValue('jrn-2');
  const tx = {
    franchisePayout: { update: jest.fn().mockResolvedValue({ id: 'po-1' }) },
    franchiseSettlement: { update: jest.fn().mockResolvedValue({}) },
  };
  const prisma = {
    franchiseSettlement: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'stl-1',
        franchiseId: 'fr-1',
        status: 'PROCESSING',
        franchiseShare: SHARE,
        gstAmount: GST,
        tdsAmount: TDS,
        netPayable: NET,
        periodStart: new Date('2026-06-01'),
        periodEnd: new Date('2026-06-30'),
        payout: null,
        franchise: {
          bankAccount: {
            accountHolderName: 'X',
            accountNumber: '50100123456789',
            ifsc: 'HDFC0001234',
            bankName: 'HDFC',
            verified: true,
            razorpayLinkedAccountId: 'acc_1',
          },
        },
      }),
    },
    franchisePayout: { upsert: jest.fn().mockResolvedValue({ id: 'po-1' }), update: jest.fn() },
    $transaction: (fn: (t: unknown) => Promise<unknown>) => fn(tx),
  } as never;

  const svc = new FranchisePayoutService(
    prisma,
    { postJournal } as never,
    { createTransfer: jest.fn().mockResolvedValue({ id: 'trf_1', status: 'processed' }) } as never,
    { assertPayoutAllowed: jest.fn().mockResolvedValue(undefined) } as never,
    { payoutCompleted: jest.fn(), payoutFailed: jest.fn() } as never,
  );
  await svc.payoutSettlement('admin-1', 'stl-1');
  return postJournal.mock.calls[0][0].lines as Line[];
}

const netOn = (lines: Line[], code: string) =>
  lines
    .filter((l) => l.accountCode === code)
    .reduce((sum, l) => sum + l.credit - l.debit, 0);

const balances = (lines: Line[]) => {
  const d = lines.reduce((s, l) => s + l.debit, 0);
  const c = lines.reduce((s, l) => s + l.credit, 0);
  return Math.abs(d - c) < 0.005;
};

describe('franchise ledger — settlement then payout', () => {
  it('settlement books the GST liability, not just the share', async () => {
    const lines = await settlementLines();

    // We owe the partner share + GST — that is what they invoice us.
    expect(netOn(lines, LEDGER_ACCOUNT_CODES.FRANCHISE_PAYABLE)).toBeCloseTo(SHARE + GST);
    // GST is reclaimable input credit (an asset), not an expense.
    expect(netOn(lines, LEDGER_ACCOUNT_CODES.GST_INPUT_CREDIT)).toBeCloseTo(-GST);
    expect(balances(lines)).toBe(true);
  });

  it('payout clears exactly what the settlement booked — FRANCHISE_PAYABLE nets to zero', async () => {
    const settle = await settlementLines();
    const pay = await payoutLines();

    const credited = netOn(settle, LEDGER_ACCOUNT_CODES.FRANCHISE_PAYABLE); // +14.16
    const debited = netOn(pay, LEDGER_ACCOUNT_CODES.FRANCHISE_PAYABLE); // −14.16

    // This is the bug: it used to be +12.00 then −14.16, leaving −2.16 stranded
    // on the payable account after every settlement.
    expect(credited + debited).toBeCloseTo(0);
  });

  it('both journals balance on their own', async () => {
    expect(balances(await settlementLines())).toBe(true);
    expect(balances(await payoutLines())).toBe(true);
  });

  it('TDS ends up as a liability we owe the government', async () => {
    const pay = await payoutLines();
    expect(netOn(pay, LEDGER_ACCOUNT_CODES.TDS_PAYABLE)).toBeCloseTo(TDS);
  });
});
