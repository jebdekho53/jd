import { BadRequestException } from '@nestjs/common';
import { RiderPayoutStatus } from '@prisma/client';
import { RiderPayoutService } from './rider-payout.service';
import { LEDGER_ACCOUNT_CODES } from './ledger-accounts.constants';

const PAYOUT = {
  id: 'rp-1',
  riderProfileId: 'rider-1',
  status: RiderPayoutStatus.PROCESSING,
  totalAmount: 800,
  riderProfile: {
    bankAccount: { verified: true, razorpayLinkedAccountId: 'acc_r1' },
  },
};

function harness(opts: { payout?: Record<string, unknown> | null; transfer?: jest.Mock; routeEnabled?: boolean } = {}) {
  const update = jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'rp-1', ...data }));
  const prisma = {
    riderPayout: {
      findUnique: jest.fn().mockResolvedValue(opts.payout === undefined ? PAYOUT : opts.payout),
      findFirst: jest.fn().mockResolvedValue(opts.payout === undefined ? PAYOUT : opts.payout),
      update,
    },
  } as never;
  const ledger = { recordRiderPayout: jest.fn(), postJournal: jest.fn().mockResolvedValue('jrn') } as never;
  const cache = { invalidatePayouts: jest.fn() } as never;
  const razorpay = {
    isRouteEnabled: jest.fn().mockReturnValue(opts.routeEnabled ?? true),
    createTransfer: opts.transfer ?? jest.fn().mockResolvedValue({ id: 'trf_r1', status: 'processed' }),
  } as never;
  return { svc: new RiderPayoutService(prisma, ledger, cache, razorpay), update, ledger, razorpay };
}

describe('rider payout via Route', () => {
  it('transfers and marks the payout PAID with the transfer id as reference', async () => {
    const { svc, update, razorpay } = harness();
    const res = await svc.processViaRoute('rp-1', 'admin-1');

    expect((razorpay as never as { createTransfer: jest.Mock }).createTransfer.mock.calls[0][0])
      .toMatchObject({ linkedAccountId: 'acc_r1', amountRupees: 800 });
    expect(res.status).toBe(RiderPayoutStatus.PAID);
    expect(update.mock.calls.at(-1)?.[0].data.referenceId).toBe('trf_r1');
  });

  it('refuses when the rider bank account is unverified', async () => {
    const { svc, razorpay } = harness({
      payout: { ...PAYOUT, riderProfile: { bankAccount: { verified: false, razorpayLinkedAccountId: null } } },
    });
    await expect(svc.processViaRoute('rp-1', 'admin-1')).rejects.toThrow(/not verified/i);
    expect((razorpay as never as { createTransfer: jest.Mock }).createTransfer).not.toHaveBeenCalled();
  });

  it('is idempotent — an already-PAID payout is returned, not re-sent', async () => {
    const { svc, razorpay } = harness({ payout: { ...PAYOUT, status: RiderPayoutStatus.PAID } });
    await svc.processViaRoute('rp-1', 'admin-1');
    expect((razorpay as never as { createTransfer: jest.Mock }).createTransfer).not.toHaveBeenCalled();
  });

  it('marks FAILED (not PAID) when the transfer create throws', async () => {
    const { svc, update } = harness({
      transfer: jest.fn().mockRejectedValue(new Error('insufficient balance')),
    });
    await expect(svc.processViaRoute('rp-1', 'admin-1')).rejects.toThrow(BadRequestException);
    expect(update.mock.calls[0][0].data.status).toBe(RiderPayoutStatus.FAILED);
  });
});

describe('rider payout — transfer failed reconciliation', () => {
  it('reverts a PAID payout to FAILED and reverses the ledger', async () => {
    const { svc, update, ledger } = harness({ payout: { id: 'rp-1', riderProfileId: 'rider-1', totalAmount: 800 } });

    await svc.onTransferFailed({ transferId: 'trf_r1', status: 'reversed', failureReason: 'bank rejected' });

    expect(update.mock.calls[0][0].data).toMatchObject({ status: RiderPayoutStatus.FAILED, paidAt: null });
    const { lines, idempotencyKey } = (ledger as never as { postJournal: jest.Mock }).postJournal.mock.calls[0][0];
    expect(idempotencyKey).toBe('rider-payout-reversal:rp-1');
    const by = Object.fromEntries(lines.map((l: never) => [l['accountCode'], l]));
    expect(by[LEDGER_ACCOUNT_CODES.CUSTOMER_RECEIVABLE].debit).toBe(800);
    expect(by[LEDGER_ACCOUNT_CODES.RIDER_PAYABLE].credit).toBe(800);
  });

  it('no-op for a transfer id that is not a rider payout', async () => {
    const { svc, ledger } = harness({ payout: null });
    await svc.onTransferFailed({ transferId: 'trf_x', status: 'failed' });
    expect((ledger as never as { postJournal: jest.Mock }).postJournal).not.toHaveBeenCalled();
  });
});
