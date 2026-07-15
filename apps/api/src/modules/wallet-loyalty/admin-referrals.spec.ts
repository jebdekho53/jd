import { AdminRewardsController } from './admin-rewards.controller';

/**
 * The admin referral list — the detail behind the "Referrals completed" count:
 * who referred whom, status (incl. PENDING and FRAUD_FLAGGED), rewards, dates.
 */
function makeController(rows: unknown[], counts: Array<{ status: string; _count: number }>) {
  const prisma = {
    referral: {
      findMany: jest.fn().mockResolvedValue(rows),
      count: jest.fn().mockResolvedValue(rows.length),
      groupBy: jest.fn().mockResolvedValue(counts),
    },
  } as never;
  // Only prisma is used on this path.
  const ctrl = new AdminRewardsController(prisma, {} as never, {} as never, {} as never, {} as never);
  return { ctrl, prisma };
}

const ROW = {
  id: 'ref-1',
  status: 'COMPLETED',
  referrerWalletCredit: 50,
  referredWalletCredit: 25,
  referrerRewardPoints: 100,
  deviceFingerprint: 'fp-1',
  createdAt: new Date('2026-07-01'),
  completedAt: new Date('2026-07-03'),
  referrer: { referralCode: 'ABC123', buyerProfile: { name: 'Asha' } },
  referred: { buyerProfile: { name: 'Bina' } },
};

describe('admin referral list', () => {
  it('maps referrer/referred names, code, rewards and status', async () => {
    const { ctrl } = makeController([ROW], [{ status: 'COMPLETED', _count: 1 }]);

    const res = await ctrl.referrals();

    expect(res.data.referrals[0]).toMatchObject({
      referrerName: 'Asha',
      referrerCode: 'ABC123',
      referredName: 'Bina',
      referrerReward: 50,
      referredReward: 25,
      status: 'COMPLETED',
    });
  });

  it('returns per-status counts, defaulting missing statuses to 0', async () => {
    const { ctrl } = makeController([ROW], [
      { status: 'COMPLETED', _count: 3 },
      { status: 'FRAUD_FLAGGED', _count: 2 },
    ]);

    const res = await ctrl.referrals();

    expect(res.data.counts).toEqual({ PENDING: 0, COMPLETED: 3, REJECTED: 0, FRAUD_FLAGGED: 2 });
  });

  it('filters by status when provided', async () => {
    const { ctrl, prisma } = makeController([], []);

    await ctrl.referrals('FRAUD_FLAGGED' as never);

    expect((prisma as never as { referral: { findMany: jest.Mock } }).referral.findMany.mock.calls[0][0].where)
      .toEqual({ status: 'FRAUD_FLAGGED' });
  });

  it('handles a referred/referrer with no name gracefully', async () => {
    const { ctrl } = makeController(
      [{ ...ROW, referrer: { referralCode: 'X', buyerProfile: null }, referred: { buyerProfile: null } }],
      [{ status: 'COMPLETED', _count: 1 }],
    );

    const res = await ctrl.referrals();
    expect(res.data.referrals[0].referrerName).toBe('—');
    expect(res.data.referrals[0].referredName).toBe('—');
  });

  it('caps the page size at 100', async () => {
    const { ctrl, prisma } = makeController([], []);
    await ctrl.referrals(undefined, '1', '9999');
    expect((prisma as never as { referral: { findMany: jest.Mock } }).referral.findMany.mock.calls[0][0].take)
      .toBe(100);
  });
});
