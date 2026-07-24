import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ReferralStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

/** Flat reward paid to the referrer once the rider they invited completes
 *  their first delivery. Credited via the referrer's next weekly payout
 *  (see RiderPayoutService.generateWeeklyPayout) rather than a wallet credit —
 *  riders don't have an in-app wallet balance the way buyers do. */
const REFERRAL_REWARD_AMOUNT = 100;

@Injectable()
export class RiderReferralService {
  private readonly logger = new Logger(RiderReferralService.name);

  constructor(private readonly prisma: PrismaService) {}

  private generateCode(): string {
    return `RID${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  /** Lazily generates+persists a referral code the first time it's needed —
   *  avoids forcing every historical rider to be backfilled up front. */
  async ensureReferralCode(riderProfileId: string): Promise<string> {
    const profile = await this.prisma.riderProfile.findUniqueOrThrow({
      where: { id: riderProfileId },
      select: { referralCode: true },
    });
    if (profile.referralCode) return profile.referralCode;

    let code = this.generateCode();
    for (let i = 0; i < 5; i++) {
      try {
        const updated = await this.prisma.riderProfile.update({
          where: { id: riderProfileId },
          data: { referralCode: code },
          select: { referralCode: true },
        });
        return updated.referralCode!;
      } catch {
        code = this.generateCode();
      }
    }
    throw new Error('Could not generate a unique rider referral code');
  }

  /** Called during registration when the new rider entered someone else's
   *  code. Silently no-ops on an invalid/self-referral code rather than
   *  blocking signup over it — a wrong code shouldn't stop onboarding. */
  async applyReferralCode(newRiderProfileId: string, code?: string): Promise<void> {
    if (!code?.trim()) return;
    const referrer = await this.prisma.riderProfile.findUnique({
      where: { referralCode: code.trim().toUpperCase() },
      select: { id: true },
    });
    if (!referrer || referrer.id === newRiderProfileId) return;

    await this.prisma.riderReferral
      .create({
        data: { referrerRiderProfileId: referrer.id, referredRiderProfileId: newRiderProfileId },
      })
      .catch((err) => {
        this.logger.warn({ err, newRiderProfileId }, 'Rider referral link could not be created');
      });
  }

  /** Call right after a rider's totalDeliveries increments — completes their
   *  inbound referral (if any) only the first time it crosses zero. */
  async completeIfFirstDelivery(riderProfileId: string, totalDeliveriesAfterIncrement: number): Promise<void> {
    if (totalDeliveriesAfterIncrement !== 1) return;

    const referral = await this.prisma.riderReferral.findUnique({
      where: { referredRiderProfileId: riderProfileId },
    });
    if (!referral || referral.status !== ReferralStatus.PENDING) return;

    await this.prisma.riderReferral.update({
      where: { id: referral.id },
      data: {
        status: ReferralStatus.COMPLETED,
        rewardAmount: REFERRAL_REWARD_AMOUNT,
        completedAt: new Date(),
      },
    });
  }

  /** Unpaid, completed reward total for this rider — folded into the next
   *  weekly payout's `incentives` line, then marked paid there. */
  async getPendingRewardTotal(riderProfileId: string): Promise<{ total: number; referralIds: string[] }> {
    const rows = await this.prisma.riderReferral.findMany({
      where: { referrerRiderProfileId: riderProfileId, status: ReferralStatus.COMPLETED, paidOut: false },
      select: { id: true, rewardAmount: true },
    });
    return {
      total: rows.reduce((s, r) => s + Number(r.rewardAmount ?? 0), 0),
      referralIds: rows.map((r) => r.id),
    };
  }

  async markRewardsPaid(referralIds: string[]): Promise<void> {
    if (referralIds.length === 0) return;
    await this.prisma.riderReferral.updateMany({
      where: { id: { in: referralIds } },
      data: { paidOut: true },
    });
  }

  async getMyReferrals(riderProfileId: string) {
    const code = await this.ensureReferralCode(riderProfileId);
    const referrals = await this.prisma.riderReferral.findMany({
      where: { referrerRiderProfileId: riderProfileId },
      orderBy: { createdAt: 'desc' },
    });

    const totalEarned = referrals
      .filter((r) => r.status === ReferralStatus.COMPLETED)
      .reduce((s, r) => s + Number(r.rewardAmount ?? 0), 0);

    return {
      code,
      rewardPerReferral: REFERRAL_REWARD_AMOUNT,
      totalEarned,
      referrals: referrals.map((r) => ({
        status: r.status,
        rewardAmount: r.rewardAmount != null ? Number(r.rewardAmount) : null,
        completedAt: r.completedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async validateCodeExists(code: string): Promise<void> {
    const referrer = await this.prisma.riderProfile.findUnique({ where: { referralCode: code.trim().toUpperCase() } });
    if (!referrer) throw new BadRequestException('Invalid referral code');
  }
}
