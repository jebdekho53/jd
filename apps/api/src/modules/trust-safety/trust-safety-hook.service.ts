import { Injectable, Logger } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ReferralFraudDetectorService } from './referral-fraud-detector.service';
import { WalletFraudDetectorService } from './wallet-fraud-detector.service';
import { CouponFraudDetectorService } from './coupon-fraud-detector.service';
import { CodFraudDetectorService } from './cod-fraud-detector.service';
import { RiderFraudDetectorService } from './rider-fraud-detector.service';
import { MerchantFraudDetectorService } from './merchant-fraud-detector.service';
import { AccountSecurityService } from './account-security.service';
import { RiskEngineService } from './risk-engine.service';
import type { DeviceContext } from './device-fingerprint.service';

@Injectable()
export class TrustSafetyHookService {
  private readonly logger = new Logger(TrustSafetyHookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly referral: ReferralFraudDetectorService,
    private readonly wallet: WalletFraudDetectorService,
    private readonly coupon: CouponFraudDetectorService,
    private readonly cod: CodFraudDetectorService,
    private readonly rider: RiderFraudDetectorService,
    private readonly merchant: MerchantFraudDetectorService,
    private readonly account: AccountSecurityService,
    private readonly risk: RiskEngineService,
  ) {}

  async beforeReferralApply(ctx: Parameters<ReferralFraudDetectorService['evaluate']>[0]) {
    try {
      return await this.referral.evaluate(ctx);
    } catch (err) {
      this.logger.error({ err }, 'Referral fraud check failed');
      return { allowed: true };
    }
  }

  async beforeCodCheckout(userId: string) {
    try {
      return await this.cod.evaluateCodCheckout(userId);
    } catch (err) {
      this.logger.error({ err }, 'COD fraud check failed');
      return { allowed: true };
    }
  }

  async beforeCouponApply(userId: string, couponId: string, ctx: DeviceContext) {
    try {
      return await this.coupon.evaluateCouponRedemption(userId, couponId, ctx);
    } catch (err) {
      this.logger.error({ err }, 'Coupon fraud check failed');
      return { allowed: true };
    }
  }

  async onOrderDelivered(orderId: string, riderProfileId: string, lat?: number, lng?: number) {
    void this.rider.evaluateDeliveryCompletion(orderId, riderProfileId, lat, lng).catch(() => {});
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyerProfile: { select: { userId: true } },
        store: { include: { merchantProfile: { select: { userId: true } } } },
      },
    });
    if (order?.buyerProfile?.userId && order.paymentMethod === PaymentMethod.COD) {
      void this.cod.updateBuyerCodMetrics(order.buyerProfile.userId).catch(() => {});
    }
    if (order?.store) {
      void this.merchant
        .evaluateOrderPattern(order.storeId, order.store.merchantProfile.userId)
        .catch(() => {});
    }
  }

  async onWalletCredit(walletId: string, amount: number, referenceId?: string) {
    void this.wallet.onWalletCredit(walletId, amount, referenceId).catch(() => {});
  }

  async onOtpRequest(phone: string, ip?: string, deviceId?: string, userAgent?: string) {
    void this.account.onOtpRequest(phone, ip, deviceId, userAgent).catch(() => {});
  }

  async onOtpVerified(userId: string, ctx: DeviceContext) {
    void this.account.onOtpVerified(userId, ctx).catch(() => {});
  }

  async recalculateUser(userId: string) {
    return this.risk.recalculate(userId);
  }
}
