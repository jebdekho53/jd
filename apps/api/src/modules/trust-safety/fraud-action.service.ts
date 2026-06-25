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
      case FraudDecisionAction.MERCHANT_SUSPEND:
        await this.addRestriction(userId, AccountRestrictionType.MERCHANT_SUSPEND, reason, adminUserId);
        await this.prisma.merchantProfile.updateMany({
          where: { userId },
          data: { isBlacklisted: true, blacklistReason: reason, blacklistedAt: new Date(), blacklistedBy: adminUserId },
        });
        break;
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
