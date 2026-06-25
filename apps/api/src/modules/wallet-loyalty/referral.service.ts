import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEventType, ReferralStatus, WalletTransactionType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { FraudService } from './fraud.service';
import { TrustSafetyHookService } from '../trust-safety/trust-safety-hook.service';
import { RewardConfigService } from './reward-config.service';
import { RewardService } from './reward.service';
import { WalletService } from './wallet.service';
import { WALLET_LOYALTY_EVENTS } from './wallet-loyalty.events';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: RewardConfigService,
    private readonly wallet: WalletService,
    private readonly reward: RewardService,
    private readonly fraud: FraudService,
    private readonly trustSafety: TrustSafetyHookService,
    private readonly domainEvents: DomainEventsService,
    private readonly events: EventEmitter2,
  ) {}

  async applyReferralCode(buyerProfileId: string, code: string, deviceFingerprint?: string) {
    const referredWallet = await this.wallet.getOrCreateWallet(buyerProfileId);
    if (referredWallet.referredById) {
      throw new BadRequestException('Referral already applied');
    }

    const referrer = await this.prisma.buyerWallet.findUnique({
      where: { referralCode: code.toUpperCase() },
    });
    if (!referrer) throw new BadRequestException('Invalid referral code');
    if (referrer.buyerProfileId === buyerProfileId) {
      await this.fraud.flagSelfReferral(referredWallet.id);
      throw new BadRequestException('Cannot use your own referral code');
    }

    if (deviceFingerprint && referrer.deviceFingerprint === deviceFingerprint) {
      await this.fraud.flagDuplicateDevice(referredWallet.id, deviceFingerprint);
      throw new BadRequestException('Referral not allowed from this device');
    }

    const trustCheck = await this.trustSafety.beforeReferralApply({
      buyerProfileId,
      referrerWalletId: referrer.id,
      referredWalletId: referredWallet.id,
      referralCode: code.toUpperCase(),
      fingerprint: deviceFingerprint,
    });
    if (!trustCheck.allowed) {
      throw new BadRequestException(trustCheck.reason ?? 'Referral not allowed');
    }

    const existing = await this.prisma.referral.findUnique({
      where: { referredWalletId: referredWallet.id },
    });
    if (existing) return existing;

    return this.prisma.$transaction(async (tx) => {
      await tx.buyerWallet.update({
        where: { id: referredWallet.id },
        data: {
          referredById: referrer.id,
          ...(deviceFingerprint && { deviceFingerprint }),
        },
      });

      return tx.referral.create({
        data: {
          referrerWalletId: referrer.id,
          referredWalletId: referredWallet.id,
          status: ReferralStatus.PENDING,
          deviceFingerprint,
        },
      });
    });
  }

  async completeReferralOnFirstOrder(buyerProfileId: string, orderId: string): Promise<void> {
    const wallet = await this.prisma.buyerWallet.findUnique({
      where: { buyerProfileId },
    });
    if (!wallet?.referredById) return;

    const referral = await this.prisma.referral.findUnique({
      where: { referredWalletId: wallet.id },
    });
    if (!referral || referral.status !== ReferralStatus.PENDING) return;

    const priorOrders = await this.prisma.order.count({
      where: {
        buyerProfileId,
        id: { not: orderId },
        status: { in: ['DELIVERED', 'COMPLETED'] },
      },
    });
    if (priorOrders > 0) return;

    const rules = await this.config.getRules();
    const { referral: refRewards } = rules;

    await this.prisma.$transaction(async (tx) => {
      await tx.referral.update({
        where: { id: referral.id },
        data: {
          status: ReferralStatus.COMPLETED,
          completedAt: new Date(),
          referrerRewardPoints: refRewards.referrerPoints,
          referredRewardPoints: refRewards.referredPoints,
          referrerWalletCredit: refRewards.referrerWalletCredit,
          referredWalletCredit: refRewards.referredWalletCredit,
        },
      });

      if (refRewards.referrerWalletCredit > 0) {
        await this.wallet.creditWallet(
          tx,
          referral.referrerWalletId,
          refRewards.referrerWalletCredit,
          WalletTransactionType.REWARD_CREDIT,
          {
            referenceType: 'referral',
            referenceId: referral.id,
            description: 'Referral bonus',
            idempotencyKey: `referral-credit-referrer:${referral.id}`,
          },
        );
      }

      if (refRewards.referredWalletCredit > 0) {
        await this.wallet.creditWallet(
          tx,
          referral.referredWalletId,
          refRewards.referredWalletCredit,
          WalletTransactionType.REWARD_CREDIT,
          {
            referenceType: 'referral',
            referenceId: referral.id,
            description: 'Welcome referral bonus',
            idempotencyKey: `referral-credit-referred:${referral.id}`,
          },
        );
      }
    });

    this.events.emit(WALLET_LOYALTY_EVENTS.REFERRAL_COMPLETED, {
      referralId: referral.id,
      orderId,
      referrerWalletId: referral.referrerWalletId,
      referredWalletId: referral.referredWalletId,
    });
    void this.domainEvents.emit(
      DomainEventType.REFERRAL_COMPLETED,
      'referral',
      referral.id,
      { orderId, buyerProfileId },
      {},
    );
  }

  async getReferralSummary(buyerProfileId: string) {
    const wallet = await this.wallet.getOrCreateWallet(buyerProfileId);
    const referrals = await this.prisma.referral.findMany({
      where: { referrerWalletId: wallet.id, status: ReferralStatus.COMPLETED },
    });

    const earnings = referrals.reduce(
      (sum, r) => sum + Number(r.referrerWalletCredit ?? 0),
      0,
    );

    return {
      code: wallet.referralCode,
      inviteCount: referrals.length,
      earnings,
      pendingCount: await this.prisma.referral.count({
        where: { referrerWalletId: wallet.id, status: ReferralStatus.PENDING },
      }),
    };
  }
}
