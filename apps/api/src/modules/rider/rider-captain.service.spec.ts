import { BadRequestException } from '@nestjs/common';
import { DeliveryStatus, RiderDocumentStatus, RiderDocumentType, RiderIncentiveStatus, RiderShiftStatus } from '@prisma/client';
import { RiderCaptainService } from './rider-captain.service';

describe('RiderCaptainService', () => {
  const prisma = {
    riderProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    riderDocument: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    riderShift: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    delivery: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    riderIncentive: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    riderIncentiveProgress: {
      upsert: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const service = new RiderCaptainService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.riderProfile.findUnique.mockResolvedValue({ id: 'rp-1' });
    prisma.$transaction.mockImplementation((fn) => fn(prisma));
  });

  it('upserts rider KYC documents and marks them submitted', async () => {
    prisma.riderDocument.upsert.mockResolvedValue({ id: 'doc-1' });

    await service.saveDocument('u-1', RiderDocumentType.ID_PROOF, 'https://cdn/doc.pdf');

    expect(prisma.riderDocument.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { riderProfileId_documentType: { riderProfileId: 'rp-1', documentType: 'ID_PROOF' } },
        update: expect.objectContaining({ status: 'SUBMITTED', fileUrl: 'https://cdn/doc.pdf' }),
      }),
    );
  });

  it('rejects KYC submit when required documents are missing', async () => {
    prisma.riderDocument.findMany.mockResolvedValue([{ documentType: RiderDocumentType.ID_PROOF }]);

    await expect(service.submitKyc('u-1')).rejects.toThrow(BadRequestException);
  });

  it('starts shift idempotently and prevents overlapping active shifts', async () => {
    prisma.riderShift.findFirst.mockResolvedValueOnce({ id: 'shift-active' });

    const res = await service.startShift('u-1', {});

    expect(res).toEqual({ id: 'shift-active' });
    expect(prisma.riderShift.create).not.toHaveBeenCalled();
  });

  it('ends active shift with delivered count and earnings', async () => {
    prisma.riderShift.findFirst.mockResolvedValue({ id: 'shift-1', startedAt: new Date('2026-07-15T00:00:00Z') });
    prisma.delivery.findMany.mockResolvedValue([{ riderEarning: 20 }, { riderEarning: 30 }]);
    prisma.riderShift.update.mockResolvedValue({ id: 'shift-1', status: RiderShiftStatus.COMPLETED });

    await service.endShift('u-1', {});

    expect(prisma.delivery.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: DeliveryStatus.DELIVERED }),
      }),
    );
    expect(prisma.riderShift.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: RiderShiftStatus.COMPLETED, deliveries: 2, earnings: 50 }),
      }),
    );
  });

  it('derives incentive progress from delivered orders', async () => {
    prisma.riderIncentive.findMany.mockResolvedValue([
      {
        id: 'inc-1',
        code: 'TEN',
        title: '10 deliveries',
        description: null,
        targetDeliveries: 10,
        rewardAmount: 100,
        startsAt: new Date('2026-07-15T00:00:00Z'),
        endsAt: new Date('2026-07-16T00:00:00Z'),
        progress: [],
      },
    ]);
    prisma.delivery.count.mockResolvedValue(7);
    prisma.riderIncentiveProgress.upsert.mockResolvedValue({ deliveries: 7, completed: false });

    const res = await service.incentives('u-1');

    expect(res[0].progress).toEqual({ deliveries: 7, completed: false, remaining: 3 });
  });

  it('lists rider KYC documents with rider context for admin review', async () => {
    prisma.riderDocument.findMany.mockResolvedValue([{ id: 'doc-1' }]);

    await service.adminListDocuments(RiderDocumentStatus.SUBMITTED);

    expect(prisma.riderDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: RiderDocumentStatus.SUBMITTED },
        include: expect.objectContaining({ riderProfile: expect.any(Object) }),
      }),
    );
  });

  it('approves required rider documents and marks profile approved when complete', async () => {
    prisma.riderDocument.update.mockResolvedValue({ id: 'doc-1', riderProfileId: 'rp-1' });
    prisma.riderDocument.findMany.mockResolvedValue([
      { documentType: RiderDocumentType.ID_PROOF, status: RiderDocumentStatus.APPROVED },
      { documentType: RiderDocumentType.DRIVING_LICENSE, status: RiderDocumentStatus.APPROVED },
      { documentType: RiderDocumentType.PROFILE_PHOTO, status: RiderDocumentStatus.APPROVED },
    ]);
    prisma.riderProfile.update.mockResolvedValue({ id: 'rp-1', kycStatus: 'APPROVED' });

    const res = await service.adminApproveDocument('doc-1', 'admin-1');

    expect(prisma.riderDocument.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'doc-1' },
        data: expect.objectContaining({ status: RiderDocumentStatus.APPROVED, reviewedBy: 'admin-1' }),
      }),
    );
    expect(prisma.riderProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { kycStatus: 'APPROVED' } }),
    );
    expect(res.profile).toEqual({ id: 'rp-1', kycStatus: 'APPROVED' });
  });

  it('rejects a required rider document with reason and marks profile rejected', async () => {
    prisma.riderDocument.update.mockResolvedValue({ id: 'doc-1', riderProfileId: 'rp-1' });
    prisma.riderDocument.findMany.mockResolvedValue([
      { documentType: RiderDocumentType.ID_PROOF, status: RiderDocumentStatus.REJECTED },
      { documentType: RiderDocumentType.DRIVING_LICENSE, status: RiderDocumentStatus.APPROVED },
      { documentType: RiderDocumentType.PROFILE_PHOTO, status: RiderDocumentStatus.APPROVED },
    ]);
    prisma.riderProfile.update.mockResolvedValue({ id: 'rp-1', kycStatus: 'REJECTED' });

    await service.adminRejectDocument('doc-1', 'admin-1', 'Blurred image');

    expect(prisma.riderDocument.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: RiderDocumentStatus.REJECTED,
          rejectionReason: 'Blurred image',
        }),
      }),
    );
    expect(prisma.riderProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { kycStatus: 'REJECTED' } }),
    );
  });

  it('creates, lists, and deactivates rider incentives', async () => {
    prisma.riderIncentive.create.mockResolvedValue({ id: 'inc-1' });

    await service.adminCreateIncentive({
      code: 'weekend',
      title: 'Weekend run',
      targetDeliveries: 12,
      rewardAmount: 300,
      startsAt: '2026-07-15T00:00:00.000Z',
      endsAt: '2026-07-16T00:00:00.000Z',
    });

    expect(prisma.riderIncentive.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ code: 'WEEKEND', status: RiderIncentiveStatus.ACTIVE }),
      }),
    );

    prisma.riderIncentive.findMany.mockResolvedValue([
      {
        id: 'inc-1',
        code: 'WEEKEND',
        title: 'Weekend run',
        description: null,
        targetDeliveries: 12,
        rewardAmount: 300,
        startsAt: new Date('2026-07-15T00:00:00.000Z'),
        endsAt: new Date('2026-07-16T00:00:00.000Z'),
        status: RiderIncentiveStatus.ACTIVE,
        _count: { progress: 2 },
        progress: [{ id: 'p-1' }],
        createdAt: new Date('2026-07-14T00:00:00.000Z'),
        updatedAt: new Date('2026-07-14T00:00:00.000Z'),
      },
    ]);

    const list = await service.adminListIncentives(RiderIncentiveStatus.ACTIVE);
    expect(list[0]).toMatchObject({ participants: 2, completed: 1, rewardAmount: 300 });

    prisma.riderIncentive.findUnique.mockResolvedValue({
      id: 'inc-1',
      startsAt: new Date('2026-07-15T00:00:00.000Z'),
      endsAt: new Date('2026-07-16T00:00:00.000Z'),
    });
    prisma.riderIncentive.update.mockResolvedValue({ id: 'inc-1', status: RiderIncentiveStatus.EXPIRED });

    await service.adminUpdateIncentive('inc-1', { status: RiderIncentiveStatus.EXPIRED });

    expect(prisma.riderIncentive.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'inc-1' }, data: expect.objectContaining({ status: RiderIncentiveStatus.EXPIRED }) }),
    );
  });
});
