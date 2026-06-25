import { Injectable } from '@nestjs/common';
import { WalletFraudReviewStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FraudService {
  constructor(private readonly prisma: PrismaService) {}

  async flagSelfReferral(walletId: string) {
    return this.createReview(walletId, 'SELF_REFERRAL', { reason: 'User attempted self-referral' });
  }

  async flagDuplicateDevice(walletId: string, fingerprint: string) {
    return this.createReview(walletId, 'DUPLICATE_DEVICE', { fingerprint });
  }

  async flagSuspiciousCredit(walletId: string, amount: number, metadata?: Record<string, unknown>) {
    if (amount < 500) return null;
    return this.createReview(walletId, 'SUSPICIOUS_CREDIT', { amount, ...metadata });
  }

  private async createReview(walletId: string, reviewType: string, metadata: Record<string, unknown>) {
    return this.prisma.walletFraudReview.create({
      data: {
        walletId,
        reviewType,
        status: WalletFraudReviewStatus.PENDING,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }

  async listPendingReviews(limit = 50) {
    return this.prisma.walletFraudReview.findMany({
      where: { status: WalletFraudReviewStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        wallet: {
          select: {
            id: true,
            referralCode: true,
            balance: true,
            buyerProfile: { select: { id: true, name: true, userId: true } },
          },
        },
      },
    });
  }

  async resolveReview(reviewId: string, adminUserId: string, approve: boolean) {
    return this.prisma.walletFraudReview.update({
      where: { id: reviewId },
      data: {
        status: approve ? WalletFraudReviewStatus.APPROVED : WalletFraudReviewStatus.REJECTED,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
    });
  }
}
