import { BadRequestException } from '@nestjs/common';
import { ExpansionLeadStatus, FranchisePartnerStatus, Prisma } from '@prisma/client';
import { FranchiseApplicationService } from './franchise-application.service';

/**
 * Phase 2 — the application funnel.
 *
 * Covers duplicate submissions, the transactional integrity of approval, and the
 * exclusivity conflict surfacing on the requested pincodes.
 */

const uniqueViolation = (target: string[]) =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: { target },
  });

const LEAD = {
  id: 'lead-1',
  name: 'Rahul Seth',
  phone: '+919876543210',
  email: 'rahul@example.com',
  city: 'Ghaziabad',
  state: 'Uttar Pradesh',
  pincodes: ['201001', '201002'],
  status: ExpansionLeadStatus.NEW,
};

const VALID_APPLICATION = {
  name: 'Rahul Seth',
  phone: '+919876543210',
  city: 'Ghaziabad',
  state: 'Uttar Pradesh',
  pincodes: ['201001'],
};

describe('submitApplication — public funnel', () => {
  it('creates a real ExpansionLead (the model was previously never written to)', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'lead-9', status: ExpansionLeadStatus.NEW });
    const prisma = {
      expansionLead: { findFirst: jest.fn().mockResolvedValue(null), create },
    } as never;

    const res = await new FranchiseApplicationService(prisma, {} as never).submitApplication(
      VALID_APPLICATION,
    );

    expect(res).toEqual({ id: 'lead-9', status: ExpansionLeadStatus.NEW, duplicate: false });
    expect(create.mock.calls[0][0].data).toMatchObject({
      phone: '+919876543210',
      city: 'Ghaziabad',
      pincodes: ['201001'],
      status: ExpansionLeadStatus.NEW,
    });
  });

  it('a repeat application from the same phone does NOT create a second lead and does not throw', async () => {
    const create = jest.fn();
    const prisma = {
      expansionLead: {
        findFirst: jest.fn().mockResolvedValue({ id: 'lead-1', status: ExpansionLeadStatus.NEW }),
        create,
      },
    } as never;

    const res = await new FranchiseApplicationService(prisma, {} as never).submitApplication(
      VALID_APPLICATION,
    );

    expect(res).toEqual({ id: 'lead-1', status: ExpansionLeadStatus.NEW, duplicate: true });
    expect(create).not.toHaveBeenCalled();
  });

  it('only an OPEN lead dedupes — a rejected applicant can apply again', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const prisma = {
      expansionLead: {
        findFirst,
        create: jest.fn().mockResolvedValue({ id: 'lead-2', status: ExpansionLeadStatus.NEW }),
      },
    } as never;

    await new FranchiseApplicationService(prisma, {} as never).submitApplication(VALID_APPLICATION);

    expect(findFirst.mock.calls[0][0].where.status.in).toEqual([
      ExpansionLeadStatus.NEW,
      ExpansionLeadStatus.CONTACTED,
      ExpansionLeadStatus.QUALIFIED,
    ]);
  });

  it('drops malformed pincodes and de-duplicates them', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'l', status: ExpansionLeadStatus.NEW });
    const prisma = {
      expansionLead: { findFirst: jest.fn().mockResolvedValue(null), create },
    } as never;

    await new FranchiseApplicationService(prisma, {} as never).submitApplication({
      ...VALID_APPLICATION,
      pincodes: ['201001', '201001', 'abc', '12'],
    });

    expect(create.mock.calls[0][0].data.pincodes).toEqual(['201001']);
  });
});

// ---------------------------------------------------------------------------

function buildApproveHarness(opts: {
  conflicts?: unknown[];
  txImpl?: (fn: (tx: unknown) => Promise<unknown>) => Promise<unknown>;
  existingCodes?: string[];
}) {
  const tx = {
    user: { upsert: jest.fn().mockResolvedValue({ id: 'user-1' }) },
    userRole: { upsert: jest.fn().mockResolvedValue({}) },
    franchisePartner: { create: jest.fn().mockResolvedValue({ id: 'fr-new' }) },
    franchiseAudit: { create: jest.fn().mockResolvedValue({}) },
    expansionLead: { update: jest.fn().mockResolvedValue({}) },
  };

  const $transaction =
    opts.txImpl ?? ((fn: (t: unknown) => Promise<unknown>) => fn(tx));

  const prisma = {
    expansionLead: { findUnique: jest.fn().mockResolvedValue(LEAD) },
    role: { findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'role-fr' }) },
    franchisePartner: {
      findMany: jest
        .fn()
        .mockResolvedValue((opts.existingCodes ?? []).map((referralCode) => ({ referralCode }))),
    },
    $transaction,
  } as never;

  const territory = {
    assignTerritory: jest.fn().mockResolvedValue({
      territory: { id: 'terr-new' },
      conflicts: opts.conflicts ?? [],
    }),
  } as never;

  return { svc: new FranchiseApplicationService(prisma, territory), prisma, tx, territory };
}

describe('approveLead — transactional partner creation', () => {
  it('creates user + FRANCHISE role + partner + territory inside ONE transaction', async () => {
    const { svc, tx, territory } = buildApproveHarness({});

    const res = await svc.approveLead('admin-1', 'lead-1', {});

    // Every write must have gone through the transaction client, never the root one.
    expect(tx.user.upsert).toHaveBeenCalledTimes(1);
    expect(tx.userRole.upsert).toHaveBeenCalledTimes(1);
    expect(tx.franchisePartner.create).toHaveBeenCalledTimes(1);
    expect(tx.expansionLead.update).toHaveBeenCalledTimes(1);
    // The territory is assigned with the SAME tx client, so it commits atomically.
    expect((territory as never as { assignTerritory: jest.Mock }).assignTerritory.mock.calls[0][3])
      .toBe(tx);

    expect(res.referralCode).toBe('FR-GHA-01');
    expect(res.hasConflicts).toBe(false);
  });

  it('a failure partway leaves NO orphaned user holding a FRANCHISE role', async () => {
    // Simulate the partner insert blowing up inside the transaction.
    const boom = new Error('partner insert failed');
    const { svc } = buildApproveHarness({
      txImpl: async () => {
        throw boom;
      },
    });

    await expect(svc.approveLead('admin-1', 'lead-1', {})).rejects.toThrow('partner insert failed');
    // Nothing is asserted about tx internals here on purpose: the guarantee comes from
    // every write living inside $transaction (asserted above), so the rollback is the
    // database's job. What matters is that the error propagates and is not swallowed —
    // an approval that half-succeeded must not report success.
  });

  it('marks the lead CONVERTED and records which partner it became', async () => {
    const { svc, tx } = buildApproveHarness({});

    await svc.approveLead('admin-1', 'lead-1', {});

    expect(tx.expansionLead.update.mock.calls[0][0].data).toMatchObject({
      status: ExpansionLeadStatus.CONVERTED,
      convertedFranchiseId: 'fr-new',
      reviewedBy: 'admin-1',
    });
  });

  it('creates the partner ACTIVE at the default commission (Phase 3 owns the rate)', async () => {
    const { svc, tx } = buildApproveHarness({});

    await svc.approveLead('admin-1', 'lead-1', {});

    const data = tx.franchisePartner.create.mock.calls[0][0].data;
    expect(data.status).toBe(FranchisePartnerStatus.ACTIVE);
    // commissionPercent must be left to the schema default, not set here.
    expect(data).not.toHaveProperty('commissionPercent');
  });

  it('refuses to convert the same lead twice', async () => {
    const { svc, prisma } = buildApproveHarness({});
    (prisma as never as { expansionLead: { findUnique: jest.Mock } }).expansionLead.findUnique
      .mockResolvedValue({ ...LEAD, status: ExpansionLeadStatus.CONVERTED });

    await expect(svc.approveLead('admin-1', 'lead-1', {})).rejects.toThrow(BadRequestException);
  });

  it('refuses to approve with no pincodes — there would be no territory to assign', async () => {
    const { svc, prisma } = buildApproveHarness({});
    (prisma as never as { expansionLead: { findUnique: jest.Mock } }).expansionLead.findUnique
      .mockResolvedValue({ ...LEAD, pincodes: [] });

    await expect(svc.approveLead('admin-1', 'lead-1', {})).rejects.toThrow(
      'At least one pincode is required',
    );
  });
});

describe('approveLead — exclusivity conflict on requested pincodes', () => {
  it('previews exclusive-territory conflicts before approval', async () => {
    const prisma = {
      expansionLead: { findUnique: jest.fn().mockResolvedValue(LEAD) },
    } as never;
    const territory = {
      previewConflicts: jest.fn().mockResolvedValue([{ pincode: '201001', franchiseId: 'fr-owner' }]),
    } as never;

    const res = await new FranchiseApplicationService(prisma, territory)
      .previewConflicts('lead-1', { pincodes: ['201001', 'bad', '201001'] });

    expect(res.pincodes).toEqual(['201001']);
    expect(res.conflicts).toEqual([{ pincode: '201001', franchiseId: 'fr-owner' }]);
    expect((territory as never as { previewConflicts: jest.Mock }).previewConflicts)
      .toHaveBeenCalledWith(['201001']);
  });

  it('surfaces the conflict instead of silently creating an overlapping territory', async () => {
    const { svc, territory } = buildApproveHarness({
      conflicts: [{ id: 'conf-1', pincode: '201001' }],
    });

    const res = await svc.approveLead('admin-1', 'lead-1', {});

    expect(res.hasConflicts).toBe(true);
    expect(res.conflicts).toHaveLength(1);
    // Exclusivity is on by default — that is the locked business rule.
    expect((territory as never as { assignTerritory: jest.Mock }).assignTerritory.mock.calls[0][1])
      .toMatchObject({ exclusivityEnabled: true, pincodes: ['201001', '201002'] });
  });

  it('feeds the ADMIN-overridden pincodes to territory assignment when supplied', async () => {
    const { svc, territory } = buildApproveHarness({});

    await svc.approveLead('admin-1', 'lead-1', { pincodes: ['110001'] });

    expect((territory as never as { assignTerritory: jest.Mock }).assignTerritory.mock.calls[0][1])
      .toMatchObject({ pincodes: ['110001'] });
  });
});

describe('approveLead — referral code allocation', () => {
  it('skips codes already taken in that city', async () => {
    const { svc } = buildApproveHarness({ existingCodes: ['FR-GHA-01', 'FR-GHA-02'] });

    const res = await svc.approveLead('admin-1', 'lead-1', {});

    expect(res.referralCode).toBe('FR-GHA-03');
  });

  it('retries the WHOLE transaction on a referral-code collision', async () => {
    // A concurrent approval grabbed FR-GHA-01 between our read and our write.
    // Postgres aborts a transaction on a failed statement, so the retry cannot live
    // inside it — the whole tx must be replayed with the next code.
    let call = 0;
    const tx = {
      user: { upsert: jest.fn().mockResolvedValue({ id: 'u' }) },
      userRole: { upsert: jest.fn().mockResolvedValue({}) },
      franchisePartner: { create: jest.fn().mockResolvedValue({ id: 'fr-new' }) },
      franchiseAudit: { create: jest.fn().mockResolvedValue({}) },
      expansionLead: { update: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      expansionLead: { findUnique: jest.fn().mockResolvedValue(LEAD) },
      role: { findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'role-fr' }) },
      franchisePartner: {
        // First pass sees no codes; the retry sees FR-GHA-01 now taken.
        findMany: jest
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([{ referralCode: 'FR-GHA-01' }]),
      },
      $transaction: jest.fn().mockImplementation(async (fn: (t: unknown) => Promise<unknown>) => {
        call += 1;
        if (call === 1) throw uniqueViolation(['referral_code']);
        return fn(tx);
      }),
    } as never;

    const territory = {
      assignTerritory: jest
        .fn()
        .mockResolvedValue({ territory: { id: 't' }, conflicts: [] }),
    } as never;

    const res = await new FranchiseApplicationService(prisma, territory).approveLead(
      'admin-1',
      'lead-1',
      {},
    );

    expect(call).toBe(2);
    expect(res.referralCode).toBe('FR-GHA-02');
  });

  it('does NOT retry a unique violation on some other column', async () => {
    const prisma = {
      expansionLead: { findUnique: jest.fn().mockResolvedValue(LEAD) },
      role: { findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'role-fr' }) },
      franchisePartner: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn().mockRejectedValue(uniqueViolation(['phone'])),
    } as never;

    await expect(
      new FranchiseApplicationService(prisma, {} as never).approveLead('admin-1', 'lead-1', {}),
    ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);

    // One attempt only — a phone collision is not something retrying can fix.
    expect((prisma as never as { $transaction: jest.Mock }).$transaction).toHaveBeenCalledTimes(1);
  });
});
