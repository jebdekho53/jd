import { ReturnPickupService } from './return-pickup.service';
import { ClaimActorType, OrderClaimStatus, ReturnPickupStatus } from '@prisma/client';

function makePrisma(overrides: Record<string, unknown> = {}) {
  const prisma: any = {
    returnPickup: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'rp-1', ...data })),
      update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'rp-1', ...data })),
      findMany: jest.fn().mockResolvedValue([]),
    },
    orderClaim: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'claim-1', storeId: 'store-1', buyerProfileId: 'bp-1',
        order: { deliveryLat: 28.6, deliveryLng: 77.2, deliveryAddress: { line1: 'x' } },
        store: { latitude: 28.61, longitude: 77.21 },
      }),
      update: jest.fn(),
    },
    claimRefund: { findUnique: jest.fn() },
    $transaction: jest.fn((fn: any) => fn(prisma)),
    ...overrides,
  };
  return prisma;
}

describe('ReturnPickupService', () => {
  const eligibility = { appendHistory: jest.fn() } as any;

  it('schedules a pickup, sets the claim status, and assigns the nearest rider', async () => {
    const prisma = makePrisma();
    const riders = {
      getAvailableRiders: jest.fn().mockResolvedValue([
        { id: 'rider-far', currentLat: 28.9, currentLng: 77.5 },
        { id: 'rider-near', currentLat: 28.6, currentLng: 77.2 },
      ]),
    } as any;
    const refunds = { processRefund: jest.fn() } as any;
    const svc = new ReturnPickupService(prisma, riders, eligibility, refunds);

    await svc.scheduleForClaim('claim-1', 'admin-1', ClaimActorType.ADMIN);

    expect(prisma.returnPickup.create).toHaveBeenCalled();
    // claim moved to RETURN_PICKUP_SCHEDULED
    expect(prisma.orderClaim.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: OrderClaimStatus.RETURN_PICKUP_SCHEDULED }) }),
    );
    // nearest rider assigned
    expect(prisma.returnPickup.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ riderProfileId: 'rider-near', status: ReturnPickupStatus.ASSIGNED }) }),
    );
  });

  it('leaves the pickup PENDING when no rider is online', async () => {
    const prisma = makePrisma();
    const riders = { getAvailableRiders: jest.fn().mockResolvedValue([]) } as any;
    const svc = new ReturnPickupService(prisma, riders, eligibility, { processRefund: jest.fn() } as any);
    await svc.scheduleForClaim('claim-1', 'a', ClaimActorType.ADMIN);
    expect(prisma.returnPickup.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: ReturnPickupStatus.ASSIGNED }) }),
    );
  });

  it('processes the refund only when the rider completes (item at store)', async () => {
    const prisma = makePrisma();
    prisma.returnPickup.findUnique.mockResolvedValue({
      id: 'rp-1', claimId: 'claim-1', riderProfileId: 'rider-1', status: ReturnPickupStatus.PICKED_UP,
    });
    const refunds = { processRefund: jest.fn() } as any;
    const svc = new ReturnPickupService(prisma, {} as any, eligibility, refunds);

    await svc.riderTransition('rp-1', 'rider-1', 'completed');

    expect(prisma.returnPickup.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: ReturnPickupStatus.COMPLETED }) }),
    );
    expect(refunds.processRefund).toHaveBeenCalledWith('claim-1', 'rider-1', ClaimActorType.SYSTEM);
  });

  it('rejects a transition from a rider the pickup is not assigned to', async () => {
    const prisma = makePrisma();
    prisma.returnPickup.findUnique.mockResolvedValue({
      id: 'rp-1', claimId: 'claim-1', riderProfileId: 'rider-1', status: ReturnPickupStatus.ASSIGNED,
    });
    const svc = new ReturnPickupService(prisma, {} as any, eligibility, { processRefund: jest.fn() } as any);
    await expect(svc.riderTransition('rp-1', 'rider-OTHER', 'accept')).rejects.toThrow(/not assigned to you/i);
  });

  it('does not refund on pick-up (only collects) — refund waits for completion', async () => {
    const prisma = makePrisma();
    prisma.returnPickup.findUnique.mockResolvedValue({
      id: 'rp-1', claimId: 'claim-1', riderProfileId: 'rider-1', status: ReturnPickupStatus.ACCEPTED,
    });
    const refunds = { processRefund: jest.fn() } as any;
    const svc = new ReturnPickupService(prisma, {} as any, eligibility, refunds);
    await svc.riderTransition('rp-1', 'rider-1', 'picked-up');
    expect(refunds.processRefund).not.toHaveBeenCalled();
  });

  it('rider decline releases the pickup back to PENDING (unassigned)', async () => {
    const prisma = makePrisma();
    prisma.returnPickup.findUnique.mockResolvedValue({
      id: 'rp-1', claimId: 'claim-1', riderProfileId: 'rider-1', status: ReturnPickupStatus.ASSIGNED,
    });
    const svc = new ReturnPickupService(prisma, {} as any, eligibility, { processRefund: jest.fn() } as any);
    await svc.riderDecline('rp-1', 'rider-1');
    expect(prisma.returnPickup.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ riderProfileId: null, status: ReturnPickupStatus.PENDING }) }),
    );
  });

  it('cancel reverts the claim to APPROVED and never after completion', async () => {
    const prisma = makePrisma();
    prisma.returnPickup.findUnique.mockResolvedValue({ id: 'rp-1', claimId: 'claim-1', status: ReturnPickupStatus.ASSIGNED });
    const svc = new ReturnPickupService(prisma, {} as any, eligibility, { processRefund: jest.fn() } as any);
    await svc.cancel('claim-1', 'admin-1', ClaimActorType.ADMIN);
    expect(prisma.returnPickup.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: ReturnPickupStatus.CANCELLED }) }),
    );
    expect(prisma.orderClaim.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: OrderClaimStatus.APPROVED }) }),
    );

    const prisma2 = makePrisma();
    prisma2.returnPickup.findUnique.mockResolvedValue({ id: 'rp-2', claimId: 'claim-2', status: ReturnPickupStatus.COMPLETED });
    const svc2 = new ReturnPickupService(prisma2, {} as any, eligibility, { processRefund: jest.fn() } as any);
    await expect(svc2.cancel('claim-2', 'admin-1', ClaimActorType.ADMIN)).rejects.toThrow(/already completed/i);
  });
});
