import { Injectable } from '@nestjs/common';
import { FraudCaseCategory, FraudDecisionAction, ReferralStatus, TrustAlertType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DeviceFingerprintService } from './device-fingerprint.service';
import { FraudActionService } from './fraud-action.service';
import { FraudCaseService } from './fraud-case.service';
import { RiskEngineService } from './risk-engine.service';
import { TrustAlertService } from './trust-alert.service';
import type { DeviceContext } from './device-fingerprint.service';

export interface ReferralCheckContext extends DeviceContext {
  buyerProfileId: string;
  referrerWalletId: string;
  referredWalletId: string;
  referralCode: string;
  deliveryAddress?: string;
  paymentMethod?: string;
  deliveryLat?: number;
  deliveryLng?: number;
}

@Injectable()
export class ReferralFraudDetectorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly devices: DeviceFingerprintService,
    private readonly cases: FraudCaseService,
    private readonly actions: FraudActionService,
    private readonly risk: RiskEngineService,
    private readonly alerts: TrustAlertService,
  ) {}

  async evaluate(ctx: ReferralCheckContext): Promise<{ allowed: boolean; reason?: string }> {
    const referred = await this.prisma.buyerProfile.findUnique({
      where: { id: ctx.buyerProfileId },
      select: { userId: true },
    });
    const referrerWallet = await this.prisma.buyerWallet.findUnique({
      where: { id: ctx.referrerWalletId },
      include: { buyerProfile: { select: { userId: true } } },
    });
    if (!referred || !referrerWallet) return { allowed: true };

    if (referrerWallet.buyerProfileId === ctx.buyerProfileId) {
      await this.flag(referred.userId, 'SELF_REFERRAL', 'Self referral attempt', ctx);
      return { allowed: false, reason: 'Cannot use your own referral code' };
    }

    if (ctx.fingerprint) {
      const sameDevice = referrerWallet.deviceFingerprint === ctx.fingerprint;
      const ring = await this.devices.countAccountsOnDevice(ctx.fingerprint);
      if (sameDevice || ring >= 3) {
        await this.flag(referred.userId, 'SAME_DEVICE_REFERRAL', 'Same device referral', ctx);
        return { allowed: false, reason: 'Referral not allowed from this device' };
      }
    }

    if (ctx.ipAddress && referrerWallet.deviceFingerprint) {
      const referrerDevice = await this.prisma.deviceFingerprint.findFirst({
        where: { fingerprint: referrerWallet.deviceFingerprint, ipAddress: ctx.ipAddress },
      });
      if (referrerDevice) {
        await this.flag(referred.userId, 'SAME_IP_REFERRAL', 'Same IP referral', ctx);
        return { allowed: false, reason: 'Referral not allowed from this network' };
      }
    }

    if (ctx.deliveryAddress) {
      const prior = await this.prisma.referral.count({
        where: {
          referrerWalletId: ctx.referrerWalletId,
          status: { in: [ReferralStatus.PENDING, ReferralStatus.COMPLETED] },
        },
      });
      void prior;
    }

    void this.devices.track(referred.userId, ctx);
    return { allowed: true };
  }

  private async flag(userId: string, rule: string, title: string, ctx: ReferralCheckContext) {
    const key = `referral:${rule}:${ctx.buyerProfileId}:${ctx.referralCode}`;
    await this.risk.recordEvent({
      userId,
      eventType: rule,
      severity: 'HIGH',
      idempotencyKey: key,
      metadata: ctx as unknown as Record<string, unknown>,
    });

    const fraudCase = await this.cases.openCase({
      userId,
      category: FraudCaseCategory.REFERRAL_ABUSE,
      severity: 'HIGH',
      title,
      description: `Referral abuse detected: ${rule}`,
      subjectType: 'referral',
      subjectId: ctx.referredWalletId,
      idempotencyKey: key,
    });

    await this.actions.apply(userId, FraudDecisionAction.REFERRAL_FREEZE, title, undefined, `${key}:action`);
    await this.alerts.raise(
      TrustAlertType.REFERRAL_ABUSE,
      'HIGH',
      title,
      `Case ${fraudCase.caseNumber}: ${rule}`,
      { userId, caseId: fraudCase.id },
    );
  }
}
