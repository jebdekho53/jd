import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DeliveryStatus,
  KycStatus,
  NotificationType,
  Prisma,
  RiderDocumentStatus,
  RiderDocumentType,
  RiderIncentiveStatus,
  RiderShiftStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { decimalToNumber, roundMoney } from '../settlement/settlement.utils';
import { RiderPushNotificationService } from '../push/rider-push-notification.service';

export const REQUIRED_RIDER_DOCUMENTS = [
  RiderDocumentType.ID_PROOF,
  RiderDocumentType.DRIVING_LICENSE,
  RiderDocumentType.PROFILE_PHOTO,
] as const;

@Injectable()
export class RiderCaptainService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly riderPush: RiderPushNotificationService,
  ) {}

  async riderProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.riderProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Rider profile not found');
    return profile.id;
  }

  async listDocuments(userId: string) {
    const riderProfileId = await this.riderProfileId(userId);
    return this.prisma.riderDocument.findMany({
      where: { riderProfileId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async saveDocument(userId: string, documentType: RiderDocumentType, fileUrl: string) {
    const riderProfileId = await this.riderProfileId(userId);
    return this.prisma.riderDocument.upsert({
      where: { riderProfileId_documentType: { riderProfileId, documentType } },
      update: {
        fileUrl,
        status: RiderDocumentStatus.SUBMITTED,
        rejectionReason: null,
        reviewedAt: null,
        reviewedBy: null,
      },
      create: {
        riderProfileId,
        documentType,
        fileUrl,
        status: RiderDocumentStatus.SUBMITTED,
      },
    });
  }

  async submitKyc(userId: string) {
    const riderProfileId = await this.riderProfileId(userId);
    const docs = await this.prisma.riderDocument.findMany({ where: { riderProfileId } });
    const uploaded = new Set(docs.map((d) => d.documentType));
    const missing = REQUIRED_RIDER_DOCUMENTS.filter((doc) => !uploaded.has(doc));
    if (missing.length > 0) {
      throw new BadRequestException(`Missing required documents: ${missing.join(', ')}`);
    }
    await this.prisma.riderProfile.update({
      where: { id: riderProfileId },
      data: { kycStatus: 'SUBMITTED' },
    });
    return { riderProfileId, status: 'SUBMITTED', documents: docs.length };
  }

  async currentShift(userId: string) {
    const riderProfileId = await this.riderProfileId(userId);
    return this.prisma.riderShift.findFirst({
      where: { riderProfileId, status: RiderShiftStatus.ACTIVE },
      orderBy: { startedAt: 'desc' },
    });
  }

  async startShift(userId: string, input: { latitude?: number; longitude?: number }) {
    const riderProfileId = await this.riderProfileId(userId);
    const existing = await this.prisma.riderShift.findFirst({
      where: { riderProfileId, status: RiderShiftStatus.ACTIVE },
      orderBy: { startedAt: 'desc' },
    });
    if (existing) return existing;
    return this.prisma.riderShift.create({
      data: {
        riderProfileId,
        startLat: input.latitude,
        startLng: input.longitude,
      },
    });
  }

  async endShift(userId: string, input: { latitude?: number; longitude?: number }) {
    const riderProfileId = await this.riderProfileId(userId);
    const shift = await this.prisma.riderShift.findFirst({
      where: { riderProfileId, status: RiderShiftStatus.ACTIVE },
      orderBy: { startedAt: 'desc' },
    });
    if (!shift) throw new BadRequestException('No active shift to end');

    const delivered = await this.prisma.delivery.findMany({
      where: {
        riderProfileId,
        status: DeliveryStatus.DELIVERED,
        deliveredAt: { gte: shift.startedAt },
      },
      select: { riderEarning: true },
    });
    const earnings = roundMoney(
      delivered.reduce((sum, delivery) => sum + decimalToNumber(delivery.riderEarning ?? 0), 0),
    );
    return this.prisma.riderShift.update({
      where: { id: shift.id },
      data: {
        status: RiderShiftStatus.COMPLETED,
        endedAt: new Date(),
        endLat: input.latitude,
        endLng: input.longitude,
        deliveries: delivered.length,
        earnings,
      },
    });
  }

  async shiftHistory(userId: string) {
    const riderProfileId = await this.riderProfileId(userId);
    return this.prisma.riderShift.findMany({
      where: { riderProfileId },
      orderBy: { startedAt: 'desc' },
      take: 30,
    });
  }

  async incentives(userId: string) {
    const riderProfileId = await this.riderProfileId(userId);
    const now = new Date();
    const incentives = await this.prisma.riderIncentive.findMany({
      where: {
        status: RiderIncentiveStatus.ACTIVE,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { endsAt: 'asc' },
      include: { progress: { where: { riderProfileId }, take: 1 } },
    });

    return Promise.all(
      incentives.map(async (incentive) => {
        const deliveries = await this.prisma.delivery.count({
          where: {
            riderProfileId,
            status: DeliveryStatus.DELIVERED,
            deliveredAt: { gte: incentive.startsAt, lte: incentive.endsAt },
          },
        });
        const completed = incentive.targetDeliveries > 0 && deliveries >= incentive.targetDeliveries;
        const progress = await this.prisma.riderIncentiveProgress.upsert({
          where: { riderProfileId_incentiveId: { riderProfileId, incentiveId: incentive.id } },
          update: {
            deliveries,
            completed,
            completedAt: completed ? (incentive.progress[0]?.completedAt ?? now) : null,
          },
          create: {
            riderProfileId,
            incentiveId: incentive.id,
            deliveries,
            completed,
            completedAt: completed ? now : null,
          },
        });
        return {
          id: incentive.id,
          code: incentive.code,
          title: incentive.title,
          description: incentive.description,
          targetDeliveries: incentive.targetDeliveries,
          rewardAmount: decimalToNumber(incentive.rewardAmount),
          startsAt: incentive.startsAt.toISOString(),
          endsAt: incentive.endsAt.toISOString(),
          progress: {
            deliveries: progress.deliveries,
            completed: progress.completed,
            remaining: Math.max(0, incentive.targetDeliveries - progress.deliveries),
          },
        };
      }),
    );
  }

  async notifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, type: { in: [NotificationType.DELIVERY, NotificationType.FINANCE, NotificationType.SUPPORT, NotificationType.SYSTEM] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markNotificationRead(userId: string, notificationId?: string) {
    const where: Prisma.NotificationWhereInput = notificationId ? { id: notificationId, userId } : { userId };
    const result = await this.prisma.notification.updateMany({
      where,
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: result.count };
  }

  async adminListDocuments(status?: RiderDocumentStatus) {
    return this.prisma.riderDocument.findMany({
      where: status ? { status } : undefined,
      orderBy: { updatedAt: 'desc' },
      include: {
        riderProfile: {
          select: {
            id: true,
            name: true,
            vehicleType: true,
            vehicleNumber: true,
            licenseNumber: true,
            kycStatus: true,
            status: true,
            user: { select: { id: true, phone: true, email: true } },
          },
        },
      },
      take: 200,
    });
  }

  async adminApproveDocument(documentId: string, reviewedBy: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const document = await tx.riderDocument.update({
        where: { id: documentId },
        data: {
          status: RiderDocumentStatus.APPROVED,
          rejectionReason: null,
          reviewedAt: new Date(),
          reviewedBy,
        },
      });
      const profile = await this.syncRiderKycStatus(tx, document.riderProfileId);
      return { document, profile };
    });

    // Only the transition to APPROVED is worth a push — a single approved
    // document among several still-pending ones is not news to the rider.
    if (result.profile.kycStatus === KycStatus.APPROVED) {
      void this.riderPush.notifyKycDecision(result.profile.id, true).catch(() => {});
    }
    return result;
  }

  async adminRejectDocument(documentId: string, reviewedBy: string, reason: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const document = await tx.riderDocument.update({
        where: { id: documentId },
        data: {
          status: RiderDocumentStatus.REJECTED,
          rejectionReason: reason,
          reviewedAt: new Date(),
          reviewedBy,
        },
      });
      const profile = await this.syncRiderKycStatus(tx, document.riderProfileId);
      return { document, profile };
    });

    void this.riderPush.notifyKycDecision(result.profile.id, false, reason).catch(() => {});
    return result;
  }

  async adminListIncentives(status?: RiderIncentiveStatus) {
    const incentives = await this.prisma.riderIncentive.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ startsAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: { select: { progress: true } },
        progress: { where: { completed: true }, select: { id: true } },
      },
      take: 200,
    });

    return incentives.map((incentive) => ({
      id: incentive.id,
      code: incentive.code,
      title: incentive.title,
      description: incentive.description,
      targetDeliveries: incentive.targetDeliveries,
      rewardAmount: decimalToNumber(incentive.rewardAmount),
      startsAt: incentive.startsAt.toISOString(),
      endsAt: incentive.endsAt.toISOString(),
      status: incentive.status,
      participants: incentive._count.progress,
      completed: incentive.progress.length,
      createdAt: incentive.createdAt.toISOString(),
      updatedAt: incentive.updatedAt.toISOString(),
    }));
  }

  async adminCreateIncentive(input: {
    code: string;
    title: string;
    description?: string;
    targetDeliveries: number;
    rewardAmount: number;
    startsAt: string;
    endsAt: string;
    status?: RiderIncentiveStatus;
  }) {
    this.assertIncentiveWindow(input.startsAt, input.endsAt);
    return this.prisma.riderIncentive.create({
      data: {
        code: input.code.trim().toUpperCase(),
        title: input.title.trim(),
        description: input.description?.trim() || null,
        targetDeliveries: input.targetDeliveries,
        rewardAmount: input.rewardAmount,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        status: input.status ?? RiderIncentiveStatus.ACTIVE,
      },
    });
  }

  async adminUpdateIncentive(
    incentiveId: string,
    input: {
      title?: string;
      description?: string;
      targetDeliveries?: number;
      rewardAmount?: number;
      startsAt?: string;
      endsAt?: string;
      status?: RiderIncentiveStatus;
    },
  ) {
    const current = await this.prisma.riderIncentive.findUnique({ where: { id: incentiveId } });
    if (!current) throw new NotFoundException('Rider incentive not found');

    const startsAt = input.startsAt ?? current.startsAt.toISOString();
    const endsAt = input.endsAt ?? current.endsAt.toISOString();
    this.assertIncentiveWindow(startsAt, endsAt);

    return this.prisma.riderIncentive.update({
      where: { id: incentiveId },
      data: {
        title: input.title?.trim(),
        description: input.description === undefined ? undefined : input.description.trim() || null,
        targetDeliveries: input.targetDeliveries,
        rewardAmount: input.rewardAmount,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
        status: input.status,
      },
    });
  }

  private async syncRiderKycStatus(tx: Prisma.TransactionClient, riderProfileId: string) {
    const docs = await tx.riderDocument.findMany({ where: { riderProfileId } });
    const requiredDocs = docs.filter((doc) =>
      REQUIRED_RIDER_DOCUMENTS.includes(doc.documentType as (typeof REQUIRED_RIDER_DOCUMENTS)[number]),
    );
    const requiredTypes = new Set(requiredDocs.map((doc) => doc.documentType));
    const hasAllRequired = REQUIRED_RIDER_DOCUMENTS.every((type) => requiredTypes.has(type));
    const hasRejectedRequired = requiredDocs.some((doc) => doc.status === RiderDocumentStatus.REJECTED);
    const hasApprovedAllRequired =
      hasAllRequired && requiredDocs.every((doc) => doc.status === RiderDocumentStatus.APPROVED);

    const kycStatus = hasRejectedRequired
      ? KycStatus.REJECTED
      : hasApprovedAllRequired
        ? KycStatus.APPROVED
        : KycStatus.SUBMITTED;

    return tx.riderProfile.update({
      where: { id: riderProfileId },
      data: { kycStatus },
      select: { id: true, kycStatus: true },
    });
  }

  private assertIncentiveWindow(startsAt: string, endsAt: string) {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      throw new BadRequestException('Incentive end date must be after start date');
    }
  }
}
