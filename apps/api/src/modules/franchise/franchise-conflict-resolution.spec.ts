import { BadRequestException } from '@nestjs/common';
import { FranchiseStoreStatus, TerritoryConflictStatus } from '@prisma/client';
import { TerritoryService } from './territory.service';
import { FranchiseNotificationService } from './franchise-notification.service';
import { FRANCHISE_EVENTS } from './franchise.events';

/**
 * Phase 7 — resolving a parked attribution.
 *
 * A PENDING_REVIEW link earns the partner nothing, so this queue is the only thing
 * standing between a recruited store and the partner ever being paid for it.
 */

const PARKED = {
  id: 'link-1',
  franchiseId: 'fr-recruiter',
  storeId: 'store-1',
  status: FranchiseStoreStatus.PENDING_REVIEW,
  store: { name: 'Sharma Kirana' },
};

function harness(link: Record<string, unknown> | null = PARKED) {
  const update = jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'link-1', ...data }));
  const emit = jest.fn();
  const prisma = {
    franchiseStore: { findUnique: jest.fn().mockResolvedValue(link), update, findMany: jest.fn() },
    franchiseAudit: { create: jest.fn().mockResolvedValue({}) },
    territoryConflict: { findUnique: jest.fn(), update: jest.fn() },
  } as never;

  return { svc: new TerritoryService(prisma, { emit } as never), update, emit, prisma };
}

describe('resolveStoreLink — the queue that actually pays people', () => {
  it('APPROVE flips the parked link to ACTIVE so it finally earns', async () => {
    const { svc, update } = harness();

    const res = await svc.resolveStoreLink('admin-1', 'link-1', {
      approve: true,
      reason: 'Store sits outside the exclusive pincode after checking.',
    });

    expect(res.status).toBe(FranchiseStoreStatus.ACTIVE);
    expect(update.mock.calls[0][0].data.status).toBe(FranchiseStoreStatus.ACTIVE);
  });

  it('REJECT marks it REJECTED — the recruiter never earns from that store', async () => {
    const { svc, update } = harness();

    const res = await svc.resolveStoreLink('admin-1', 'link-1', {
      approve: false,
      reason: 'Store is inside NCR’s exclusive territory.',
    });

    expect(res.status).toBe(FranchiseStoreStatus.REJECTED);
    expect(update.mock.calls[0][0].data.conflictReason).toContain('NCR');
  });

  it('records who decided and why — this decision is worth money', async () => {
    const { svc, prisma } = harness();

    await svc.resolveStoreLink('admin-9', 'link-1', { approve: true, reason: 'Verified on call.' });

    const { data } = (prisma as never as { franchiseAudit: { create: jest.Mock } }).franchiseAudit
      .create.mock.calls[0][0];
    expect(data.actorId).toBe('admin-9');
    expect(data.metadata).toMatchObject({
      resolved: true,
      decision: 'APPROVED',
      reason: 'Verified on call.',
      franchiseStoreId: 'link-1',
    });
  });

  it('tells the partner either way', async () => {
    const approved = harness();
    await approved.svc.resolveStoreLink('a', 'link-1', { approve: true, reason: 'ok' });
    expect(approved.emit.mock.calls[0][0]).toBe(FRANCHISE_EVENTS.STORE_LINKED);

    const rejected = harness();
    await rejected.svc.resolveStoreLink('a', 'link-1', { approve: false, reason: 'not yours' });
    expect(rejected.emit.mock.calls[0][0]).toBe(FRANCHISE_EVENTS.STORE_DISPUTED);
    expect(rejected.emit.mock.calls[0][1].reason).toBe('not yours');
  });

  it('refuses to re-resolve a link that is already decided', async () => {
    const { svc } = harness({ ...PARKED, status: FranchiseStoreStatus.ACTIVE });

    await expect(
      svc.resolveStoreLink('admin-1', 'link-1', { approve: false, reason: 'changed my mind' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('404s on an unknown link rather than silently doing nothing', async () => {
    const { svc } = harness(null);

    await expect(
      svc.resolveStoreLink('admin-1', 'nope', { approve: true, reason: 'x' }),
    ).rejects.toThrow(/not found/i);
  });
});

describe('resolveConflict — territory vs territory', () => {
  it('closes the conflict with a written resolution', async () => {
    const update = jest.fn().mockResolvedValue({ id: 'c1', status: TerritoryConflictStatus.RESOLVED });
    const prisma = {
      territoryConflict: {
        findUnique: jest.fn().mockResolvedValue({ id: 'c1', franchiseId: 'fr-1' }),
        update,
      },
      franchiseAudit: { create: jest.fn().mockResolvedValue({}) },
    } as never;

    const svc = new TerritoryService(prisma, { emit: jest.fn() } as never);
    await svc.resolveConflict('admin-1', 'c1', 'Pincode reassigned by agreement.');

    expect(update.mock.calls[0][0].data).toMatchObject({
      status: TerritoryConflictStatus.RESOLVED,
      resolution: 'Pincode reassigned by agreement.',
    });
    expect(update.mock.calls[0][0].data.resolvedAt).toBeInstanceOf(Date);
  });
});

describe('notifications never break the thing they report', () => {
  it('a failing notification does not throw back into the payout/link that triggered it', async () => {
    const prisma = {
      franchisePartner: { findUnique: jest.fn().mockRejectedValue(new Error('db down')) },
      notification: { create: jest.fn() },
    } as never;
    const email = { send: jest.fn() } as never;

    const svc = new FranchiseNotificationService(prisma, email);

    // Losing an email is annoying. Failing a payout because the email bounced is not.
    await expect(svc.payoutCompleted('fr-1', 13.56, '6789')).resolves.toBeUndefined();
  });

  it('sends an in-app notification and an email when the partner has one', async () => {
    const notificationCreate = jest.fn().mockResolvedValue({});
    const send = jest.fn().mockResolvedValue({ success: true, logId: 'l1' });
    const prisma = {
      franchisePartner: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ userId: 'user-1', user: { email: 'p@example.com' } }),
      },
      notification: { create: notificationCreate },
    } as never;

    const svc = new FranchiseNotificationService(prisma, { send } as never);
    await svc.payoutCompleted('fr-1', 13.56, '6789');

    expect(notificationCreate.mock.calls[0][0].data.title).toContain('13.56');
    expect(send.mock.calls[0][0].to).toBe('p@example.com');
    expect(send.mock.calls[0][0].text).toContain('6789');
  });

  it('skips email when the partner has none, but still records the in-app entry', async () => {
    const notificationCreate = jest.fn().mockResolvedValue({});
    const send = jest.fn();
    const prisma = {
      franchisePartner: {
        findUnique: jest.fn().mockResolvedValue({ userId: 'user-1', user: { email: null } }),
      },
      notification: { create: notificationCreate },
    } as never;

    const svc = new FranchiseNotificationService(prisma, { send } as never);
    await svc.payoutFailed('fr-1', 13.56, 'insufficient balance');

    expect(notificationCreate).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
    // They are still owed the money — the message must say so.
    expect(notificationCreate.mock.calls[0][0].data.body).toMatch(/still owed/i);
  });
});
