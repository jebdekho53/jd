import { Injectable, Logger } from '@nestjs/common';
import {
  AccountRestrictionType,
  FraudDecisionAction,
  RiskProfileStatus,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FraudCaseService } from './fraud-case.service';

@Injectable()
export class FraudActionService {
  private readonly logger = new Logger(FraudActionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cases: FraudCaseService,
  ) {}

  async apply(
    userId: string,
    action: FraudDecisionAction,
    reason: string,
    adminUserId?: string,
    idempotencyKey?: string,
  ) {
    const key = idempotencyKey ?? `action:${userId}:${action}`;
    const existing = await this.prisma.fraudDecision.findUnique({ where: { idempotencyKey: key } });
    if (existing?.actionTaken) return existing;

    await this.cases.recordDecision({
      userId,
      decision: action,
      idempotencyKey: key,
      metadata: { reason, adminUserId },
      actionTaken: true,
    });

    switch (action) {
      case FraudDecisionAction.WALLET_FREEZE:
        await this.addRestriction(userId, AccountRestrictionType.WALLET_FREEZE, reason, adminUserId);
        await this.prisma.riskProfile.updateMany({
          where: { userId },
          data: { walletFrozen: true },
        });
        break;
      case FraudDecisionAction.REFERRAL_FREEZE:
        await this.addRestriction(userId, AccountRestrictionType.REFERRAL_FREEZE, reason, adminUserId);
        await this.prisma.riskProfile.updateMany({
          where: { userId },
          data: { referralFrozen: true },
        });
        break;
      case FraudDecisionAction.COUPON_FREEZE:
        await this.addRestriction(userId, AccountRestrictionType.COUPON_FREEZE, reason, adminUserId);
        await this.prisma.riskProfile.updateMany({
          where: { userId },
          data: { couponFrozen: true },
        });
        break;
      case FraudDecisionAction.COD_DISABLE:
        await this.addRestriction(userId, AccountRestrictionType.COD_DISABLE, reason, adminUserId);
        await this.prisma.riskProfile.updateMany({ where: { userId }, data: { codEnabled: false } });
        await this.prisma.buyerProfile.updateMany({ where: { userId }, data: { codEnabled: false } });
        break;
      case FraudDecisionAction.SOFT_BLOCK:
        await this.addRestriction(userId, AccountRestrictionType.SOFT_BLOCK, reason, adminUserId);
        await this.prisma.riskProfile.updateMany({
          where: { userId },
          data: { status: RiskProfileStatus.WATCHLIST },
        });
        break;
      case FraudDecisionAction.HARD_BLOCK:
        await this.addRestriction(userId, AccountRestrictionType.HARD_BLOCK, reason, adminUserId);
        await this.prisma.riskProfile.updateMany({
          where: { userId },
          data: { status: RiskProfileStatus.BLOCKED },
        });
        await this.prisma.user.update({
          where: { id: userId },
          data: { status: UserStatus.SUSPENDED },
        });
        break;
      case FraudDecisionAction.MERCHANT_SUSPEND: {
        await this.addRestriction(userId, AccountRestrictionType.MERCHANT_SUSPEND, reason, adminUserId);
        const merchantProfile = await this.prisma.merchantProfile.findUnique({
          where: { userId },
          select: { id: true },
        });
        await this.prisma.merchantProfile.updateMany({
          where: { userId },
          data: { isBlacklisted: true, blacklistReason: reason, blacklistedAt: new Date(), blacklistedBy: adminUserId },
        });
        // A blacklist is merchant-wide — deactivate every store they run, not
        // just whichever one triggered the fraud action (see admin-store.service.ts's
        // rejectStore for the same fix on the other blacklisting path).
        if (merchantProfile) {
          await this.prisma.store.updateMany({
            where: { merchantProfileId: merchantProfile.id },
            data: { isActive: false },
          });
        }
        break;
      }
      case FraudDecisionAction.RIDER_SUSPEND:
        await this.addRestriction(userId, AccountRestrictionType.RIDER_SUSPEND, reason, adminUserId);
        break;
      case FraudDecisionAction.BLACKLIST:
        await this.apply(userId, FraudDecisionAction.HARD_BLOCK, reason, adminUserId, `${key}:blacklist`);
        break;
      default:
        break;
    }

    this.logger.log({ userId, action, reason }, 'Fraud action applied');
    return { success: true, action };
  }

  async liftRestriction(restrictionId: string, adminUserId: string) {
    return this.prisma.accountRestriction.update({
      where: { id: restrictionId },
      data: { active: false, liftedAt: new Date(), liftedBy: adminUserId },
    });
  }

  /** Reverses the restriction record AND the side effect it applied — lifting
   *  a WALLET_FREEZE previously only flipped the audit row, leaving the
   *  wallet itself frozen forever with no way for an admin to undo it. */
  async liftRestrictionFully(restrictionId: string, adminUserId: string) {
    const restriction = await this.prisma.accountRestriction.findUnique({
      where: { id: restrictionId },
    });
    if (!restriction) throw new Error('Restriction not found');
    const { userId, restrictionType } = restriction;

    switch (restrictionType) {
      case AccountRestrictionType.WALLET_FREEZE:
        await this.prisma.riskProfile.updateMany({ where: { userId }, data: { walletFrozen: false } });
        break;
      case AccountRestrictionType.REFERRAL_FREEZE:
        await this.prisma.riskProfile.updateMany({ where: { userId }, data: { referralFrozen: false } });
        break;
      case AccountRestrictionType.COUPON_FREEZE:
        await this.prisma.riskProfile.updateMany({ where: { userId }, data: { couponFrozen: false } });
        break;
      case AccountRestrictionType.COD_DISABLE:
        await this.prisma.riskProfile.updateMany({ where: { userId }, data: { codEnabled: true } });
        await this.prisma.buyerProfile.updateMany({ where: { userId }, data: { codEnabled: true } });
        break;
      case AccountRestrictionType.SOFT_BLOCK:
        await this.prisma.riskProfile.updateMany({
          where: { userId, status: RiskProfileStatus.WATCHLIST },
          data: { status: RiskProfileStatus.CLEAR },
        });
        break;
      case AccountRestrictionType.HARD_BLOCK:
        await this.prisma.riskProfile.updateMany({
          where: { userId, status: RiskProfileStatus.BLOCKED },
          data: { status: RiskProfileStatus.CLEAR },
        });
        await this.prisma.user.update({ where: { id: userId }, data: { status: UserStatus.ACTIVE } });
        break;
      case AccountRestrictionType.MERCHANT_SUSPEND:
        await this.prisma.merchantProfile.updateMany({
          where: { userId },
          data: { isBlacklisted: false, blacklistReason: null, blacklistedAt: null, blacklistedBy: null },
        });
        break;
      default:
        break;
    }

    return this.liftRestriction(restrictionId, adminUserId);
  }

  private async addRestriction(
    userId: string,
    type: AccountRestrictionType,
    reason: string,
    appliedBy?: string,
  ) {
    const active = await this.prisma.accountRestriction.findFirst({
      where: { userId, restrictionType: type, active: true },
    });
    if (active) return active;

    return this.prisma.accountRestriction.create({
      data: { userId, restrictionType: type, reason, appliedBy },
    });
  }
}
