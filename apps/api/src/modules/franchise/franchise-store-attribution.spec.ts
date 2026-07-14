import { FranchiseStoreLinkService } from './franchise-store-link.service';

/**
 * A store can be approved by TWO different paths:
 *   1. approving its merchant application  (merchant-onboarding)
 *   2. the admin store-approval queue      (admin-store)
 *
 * The franchise link used to be created only in (1). A store approved via (2) left
 * its application SUBMITTED, never wrote the FranchiseStore row, and the partner who
 * actually recruited that merchant was never paid for it. Both paths now call
 * attributeStoreFromApplication(), so these tests pin that behaviour down.
 */

function buildService(opts: {
  application?: { id: string; franchiseId: string | null; referralCode: string | null } | null;
}) {
  const storeUpdate = jest.fn().mockResolvedValue({});
  const prisma = {
    merchantApplication: {
      findFirst: jest.fn().mockResolvedValue(opts.application ?? null),
    },
    store: { update: storeUpdate },
  } as never;

  const svc = new FranchiseStoreLinkService(prisma, { emit: jest.fn() } as never);
  const linkStore = jest.spyOn(svc, 'linkStore').mockResolvedValue({} as never);

  return { svc, prisma, storeUpdate, linkStore };
}

describe('attributeStoreFromApplication', () => {
  it('copies the referral onto the store and creates the FranchiseStore link', async () => {
    const { svc, storeUpdate, linkStore } = buildService({
      application: { id: 'app-1', franchiseId: 'fr-1', referralCode: 'FR-NOI-01' },
    });

    await svc.attributeStoreFromApplication('store-1', 'admin-1');

    expect(storeUpdate).toHaveBeenCalledWith({
      where: { id: 'store-1' },
      data: { franchiseId: 'fr-1', referralCode: 'FR-NOI-01' },
    });
    expect(linkStore).toHaveBeenCalledWith('fr-1', 'store-1', 'admin-1');
  });

  it('does nothing for a store that was never referred by a partner', async () => {
    const { svc, storeUpdate, linkStore } = buildService({ application: null });

    await svc.attributeStoreFromApplication('store-walkin', 'admin-1');

    expect(storeUpdate).not.toHaveBeenCalled();
    expect(linkStore).not.toHaveBeenCalled();
  });

  it('never lets an attribution failure break the store approval', async () => {
    // The caller (approveStore / approveApplication) must not blow up just because
    // the franchise bookkeeping failed — the merchant still deserves to go live.
    const { svc, linkStore } = buildService({
      application: { id: 'app-1', franchiseId: 'fr-1', referralCode: 'FR-NOI-01' },
    });
    linkStore.mockRejectedValue(new Error('link exploded'));

    await expect(svc.attributeStoreFromApplication('store-1', 'admin-1')).resolves.toBeUndefined();
  });

  it('only considers applications that actually carry a franchiseId', async () => {
    const { svc, prisma } = buildService({
      application: { id: 'app-1', franchiseId: 'fr-1', referralCode: 'FR-NOI-01' },
    });

    await svc.attributeStoreFromApplication('store-1');

    const where = (prisma as never as { merchantApplication: { findFirst: jest.Mock } })
      .merchantApplication.findFirst.mock.calls[0][0].where;
    expect(where).toEqual({ storeId: 'store-1', franchiseId: { not: null } });
  });
});
