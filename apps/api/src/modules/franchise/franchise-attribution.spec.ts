import { FranchiseStoreStatus, FranchisePartnerStatus, FranchiseAuditAction } from '@prisma/client';
import { FranchiseService } from './franchise.service';
import { FranchiseSettlementService } from './franchise-settlement.service';

/**
 * Phase 1 — the acquisition loop.
 *
 * Covers referral attribution (first-touch), the per-pincode exclusivity guard,
 * and the rule that a parked link earns nothing.
 */

const OWNER = 'fr-owner'; // partner that owns pincode 110001 exclusively
const RECRUITER = 'fr-recruiter'; // partner whose referral code the merchant used

/** FranchiseService only reads `merchantSiteUrl` (for the invite link). */
const mockConfig = () => ({ get: jest.fn().mockReturnValue('https://merchant.jebdekho.com') }) as never;

function makePrismaMock(overrides: Record<string, unknown> = {}) {
  return {
    store: {
      findUnique: jest.fn().mockResolvedValue({ id: 'store-1', pincode: '110001' }),
      update: jest.fn().mockResolvedValue({}),
    },
    franchiseTerritory: {
      findFirst: jest.fn().mockResolvedValue(null), // no exclusive territory by default
    },
    franchiseStore: {
      upsert: jest.fn().mockImplementation(({ create }) =>
        Promise.resolve({ id: 'link-1', ...create, store: { name: 'S', pincode: '110001' } }),
      ),
    },
    franchiseAudit: { create: jest.fn().mockResolvedValue({}) },
    franchisePartner: { findUnique: jest.fn(), findFirst: jest.fn() },
    ...overrides,
  } as never;
}

describe('linkStore — referral attribution', () => {
  it('links the store as ACTIVE when no other partner owns the pincode exclusively', async () => {
    const prisma = makePrismaMock();
    const svc = new FranchiseService(prisma, mockConfig());

    const link = await svc.linkStore(RECRUITER, 'store-1');

    expect(link.status).toBe(FranchiseStoreStatus.ACTIVE);
    expect(link.conflictReason).toBeNull();
    // Clean attribution is not a conflict — no audit noise.
    expect((prisma as never as { franchiseAudit: { create: jest.Mock } }).franchiseAudit.create)
      .not.toHaveBeenCalled();
  });

  it('attributes to the recruiting partner, not the territory owner', async () => {
    const prisma = makePrismaMock();
    const svc = new FranchiseService(prisma, mockConfig());

    await svc.linkStore(RECRUITER, 'store-1');

    const { franchiseStore } = prisma as never as { franchiseStore: { upsert: jest.Mock } };
    expect(franchiseStore.upsert.mock.calls[0][0].create.franchiseId).toBe(RECRUITER);
  });
});

describe('linkStore — exclusivity guard', () => {
  const blocking = {
    id: 'terr-1',
    franchiseId: OWNER,
    franchise: { businessName: 'NCR Franchise Partners Pvt Ltd' },
  };

  it('parks the link as PENDING_REVIEW when the pincode is another active partner’s exclusive turf', async () => {
    const prisma = makePrismaMock({
      franchiseTerritory: { findFirst: jest.fn().mockResolvedValue(blocking) },
    });
    const svc = new FranchiseService(prisma, mockConfig());

    const link = await svc.linkStore(RECRUITER, 'store-1');

    expect(link.status).toBe(FranchiseStoreStatus.PENDING_REVIEW);
    expect(link.conflictReason).toContain('110001');
    expect(link.conflictReason).toContain('NCR Franchise Partners Pvt Ltd');
  });

  it('writes a CONFLICT_DETECTED audit row naming both partners', async () => {
    const prisma = makePrismaMock({
      franchiseTerritory: { findFirst: jest.fn().mockResolvedValue(blocking) },
    });
    const svc = new FranchiseService(prisma, mockConfig());

    await svc.linkStore(RECRUITER, 'store-1', 'admin-9');

    const { franchiseAudit } = prisma as never as { franchiseAudit: { create: jest.Mock } };
    expect(franchiseAudit.create).toHaveBeenCalledTimes(1);
    const { data } = franchiseAudit.create.mock.calls[0][0];
    expect(data.action).toBe(FranchiseAuditAction.CONFLICT_DETECTED);
    expect(data.actorId).toBe('admin-9');
    expect(data.metadata).toMatchObject({
      claimedByFranchiseId: RECRUITER,
      territoryOwnerFranchiseId: OWNER,
      pincode: '110001',
    });
  });

  it('only a DIFFERENT partner’s territory blocks — the owner recruiting in its own turf is ACTIVE', async () => {
    // The query excludes `franchiseId: { not: franchiseId }`, so for the owner
    // recruiting inside its own territory there is no blocking row.
    const findFirst = jest.fn().mockResolvedValue(null);
    const prisma = makePrismaMock({ franchiseTerritory: { findFirst } });
    const svc = new FranchiseService(prisma, mockConfig());

    const link = await svc.linkStore(OWNER, 'store-1');

    expect(link.status).toBe(FranchiseStoreStatus.ACTIVE);
    expect(findFirst.mock.calls[0][0].where).toMatchObject({
      franchiseId: { not: OWNER },
      exclusivityEnabled: true,
      pincodes: { has: '110001' },
      franchise: { status: FranchisePartnerStatus.ACTIVE },
    });
  });
});

describe('settlement — parked links earn nothing', () => {
  it('aggregates GMV only over ACTIVE franchise-store links', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      id: RECRUITER,
      businessName: 'Recruiter Ltd',
      commissionPercent: 10,
      stores: [], // the ACTIVE-only filter returned nothing
    });
    const prisma = {
      franchisePartner: { findUnique },
      order: { aggregate: jest.fn() },
      franchiseSettlement: {
        create: jest.fn().mockResolvedValue({ id: 'stl-1' }),
        update: jest.fn(),
      },
      franchiseAudit: { create: jest.fn() },
    } as never;
    const ledger = { postJournal: jest.fn() } as never;

    await new FranchiseSettlementService(prisma, ledger).createSettlement(
      RECRUITER,
      new Date('2026-07-01'),
      new Date('2026-07-31'),
    );

    // The include must constrain to ACTIVE, or a PENDING_REVIEW link would pay out.
    expect(findUnique.mock.calls[0][0].include.stores.where).toEqual({
      status: FranchiseStoreStatus.ACTIVE,
    });
    // No ACTIVE stores => no orders queried, nothing settled, no journal posted.
    expect((prisma as never as { order: { aggregate: jest.Mock } }).order.aggregate)
      .not.toHaveBeenCalled();
    expect((ledger as never as { postJournal: jest.Mock }).postJournal).not.toHaveBeenCalled();
  });
});
