import { Injectable } from '@nestjs/common';
import { FraudCaseCategory, FraudDecisionAction } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DeviceFingerprintService } from './device-fingerprint.service';
import { FraudActionService } from './fraud-action.service';
import { FraudCaseService } from './fraud-case.service';
import { RiskEngineService } from './risk-engine.service';
import type { DeviceContext } from './device-fingerprint.service';

@Injectable()
export class CouponFraudDetectorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly devices: DeviceFingerprintService,
    private readonly risk: RiskEngineService,
    private readonly cases: FraudCaseService,
    private readonly actions: FraudActionService,
  ) {}

  async evaluateCouponRedemption(
    userId: string,
    couponId: string,
    ctx: DeviceContext & { deliveryAddress?: string },
  ): Promise<{ allowed: boolean; reason?: string }> {
    const profile = await this.risk.getOrCreateProfile(userId);
    if (profile.couponFrozen) {
      return { allowed: false, reason: 'Coupon usage restricted on your account' };
    }

    if (ctx.fingerprint) {
      const buyer = await this.prisma.buyerProfile.findUnique({ where: { userId }, select: { id: true } });
      const walletsOnDevice = await this.prisma.buyerWallet.count({
        where: { deviceFingerprint: ctx.fingerprint },
      });
      const usages = buyer
        ? await this.prisma.couponUsage.count({
            where: {
              couponId,
              buyerProfileId: { not: buyer.id },
              order: { buyerProfile: { wallet: { deviceFingerprint: ctx.fingerprint } } },
            },
          })
        : 0;
      if (walletsOnDevice >= 2 && usages >= 1) {
        await this.flag(userId, couponId, 'COUPON_SAME_DEVICE', ctx.fingerprint);
        return { allowed: false, reason: 'Coupon already used on this device' };
      }
    }

    const coupon = await this.prisma.coupon.findUnique({
      where: { id: couponId },
      select: { firstOrderOnly: true },
    });
    if (coupon?.firstOrderOnly) {
      const buyer = await this.prisma.buyerProfile.findUnique({ where: { userId } });
      if (buyer) {
        const priorOrders = await this.prisma.order.count({
          where: {
            buyerProfileId: buyer.id,
            status: { in: ['DELIVERED', 'COMPLETED', 'PAID', 'MERCHANT_ACCEPTED'] },
          },
        });
        if (priorOrders > 0) {
          await this.risk.recordEvent({
            userId,
            eventType: 'NEW_USER_OFFER_ABUSE',
            severity: 'MEDIUM',
            idempotencyKey: `coupon-first-order:${userId}:${couponId}`,
          });
          return { allowed: false, reason: 'This offer is for first-time buyers only' };
        }
      }
    }

    void this.devices.track(userId, ctx);
    return { allowed: true };
  }

  private async flag(userId: string, couponId: string, rule: string, fingerprint: string) {
    const key = `coupon:${rule}:${userId}:${couponId}`;
    await this.risk.recordEvent({
      userId,
      eventType: rule,
      severity: 'HIGH',
      idempotencyKey: key,
      metadata: { couponId, fingerprint },
    });
    await this.cases.openCase({
      userId,
      category: FraudCaseCategory.COUPON_ABUSE,
      severity: 'HIGH',
      title: 'Coupon abuse',
      description: rule,
      subjectType: 'coupon',
      subjectId: couponId,
      idempotencyKey: key,
    });
    await this.actions.apply(userId, FraudDecisionAction.COUPON_FREEZE, rule, undefined, `${key}:action`);
  }
}
