import { Prisma, FranchiseStoreStatus } from '@prisma/client';
import { FranchiseService } from './franchise.service';

const config = () =>
  ({ get: jest.fn().mockReturnValue('https://merchant.jebdekho.com') }) as never;

const uniqueViolation = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });

describe('getReferral — invite link', () => {
  it('returns the existing code and a shareable invite URL', async () => {
    const prisma = {
      franchisePartner: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'fr-1',
          referralCode: 'FR-NCR-01',
          businessName: 'NCR Franchise Partners Pvt Ltd',
          city: { name: 'Delhi' },
        }),
        update: jest.fn(),
      },
    } as never;

    const res = await new FranchiseService(prisma, config()).getReferral('fr-1');

    expect(res).toEqual({
      referralCode: 'FR-NCR-01',
      inviteUrl: 'https://merchant.jebdekho.com/?ref=FR-NCR-01',
    });
    // An existing code must never be regenerated — it is already in the wild.
    expect((prisma as never as { franchisePartner: { update: jest.Mock } }).franchisePartner.update)
      .not.toHaveBeenCalled();
  });

  it('generates FR-<CITY>-01 for a partner that has no code yet', async () => {
    const update = jest.fn().mockResolvedValue({});
    const prisma = {
      franchisePartner: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'fr-2',
          referralCode: null,
          businessName: 'Ghaziabad Partners',
          city: { name: 'Ghaziabad' },
        }),
        update,
      },
    } as never;

    const res = await new FranchiseService(prisma, config()).getReferral('fr-2');

    expect(res.referralCode).toBe('FR-GHA-01');
    expect(update.mock.calls[0][0].data).toEqual({ referralCode: 'FR-GHA-01' });
  });

  it('retries the next number when the code collides, rather than handing out a duplicate', async () => {
    // FR-GHA-01 and -02 are taken; -03 must win.
    const update = jest
      .fn()
      .mockRejectedValueOnce(uniqueViolation())
      .mockRejectedValueOnce(uniqueViolation())
      .mockResolvedValueOnce({});
    const prisma = {
      franchisePartner: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'fr-3',
          referralCode: null,
          businessName: 'Ghaziabad Two',
          city: { name: 'Ghaziabad' },
        }),
        update,
      },
    } as never;

    const res = await new FranchiseService(prisma, config()).getReferral('fr-3');

    expect(res.referralCode).toBe('FR-GHA-03');
    expect(update).toHaveBeenCalledTimes(3);
  });

  it('rethrows a non-collision database error instead of looping', async () => {
    const boom = new Error('connection lost');
    const prisma = {
      franchisePartner: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'fr-4',
          referralCode: null,
          businessName: 'X',
          city: null,
        }),
        update: jest.fn().mockRejectedValue(boom),
      },
    } as never;

    await expect(new FranchiseService(prisma, config()).getReferral('fr-4')).rejects.toThrow(
      'connection lost',
    );
  });
});

describe('getLinkedStores — disputed attributions are visible to the partner', () => {
  it('groups links by status and surfaces the conflict reason', async () => {
    const prisma = {
      franchiseStore: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'l1', status: FranchiseStoreStatus.ACTIVE, conflictReason: null, store: {} },
          {
            id: 'l2',
            status: FranchiseStoreStatus.PENDING_REVIEW,
            conflictReason: 'Pincode 110001 is in the exclusive territory of NCR',
            store: {},
          },
          { id: 'l3', status: FranchiseStoreStatus.REJECTED, conflictReason: 'x', store: {} },
        ]),
      },
    } as never;

    const res = await new FranchiseService(prisma, config()).getLinkedStores('fr-1');

    expect(res.active.map((l) => l.id)).toEqual(['l1']);
    expect(res.rejected.map((l) => l.id)).toEqual(['l3']);
    expect(res.pendingReview).toHaveLength(1);
    expect(res.pendingReview[0].conflictReason).toContain('110001');
  });
});
