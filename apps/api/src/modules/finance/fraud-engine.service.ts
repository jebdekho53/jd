import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FinanceAlertSeverity, FinanceAlertType, OrderRefundStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FinanceAlertService } from '../finance/finance-alert.service';
import { DistributedLockService } from '../../redis/distributed-lock.service';

const LOOKBACK_DAYS = 30;

@Injectable()
export class FraudEngineService {
  private readonly logger = new Logger(FraudEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alerts: FinanceAlertService,
    private readonly lock: DistributedLockService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async runHourlyScan(): Promise<void> {
    await this.lock.runExclusive('cron:fraud-engine', 3000, async () => {
      const since = new Date(Date.now() - LOOKBACK_DAYS * 86400000);
      await Promise.all([
        this.scanRefundAbuse(since),
        this.scanCancellationAbuse(since),
        this.scanCodFailures(since),
        this.scanCouponFarming(since),
        this.scanReferralAbuse(since),
        this.scanWalletAbuse(since),
        this.scanAiBillingAbuse(since),
      ]);
      this.logger.debug('Fraud engine hourly scan completed');
    });
  }

  private async scanRefundAbuse(since: Date): Promise<void> {
    const rows = await this.prisma.orderRefund.groupBy({
      by: ['orderId'],
      where: { createdAt: { gte: since }, status: OrderRefundStatus.REFUNDED },
      _count: { id: true },
    });
    const orderIds = rows.filter((r) => r._count.id >= 2).map((r) => r.orderId);
    for (const orderId of orderIds.slice(0, 10)) {
      await this.alerts.raiseFraudAlert({
        alertType: FinanceAlertType.FRAUD_REFUND_ABUSE,
        severity: FinanceAlertSeverity.WARNING,
        title: `Multiple refunds on order ${orderId}`,
        message: 'Order has more than one successful refund in 30 days',
        metadata: { orderId },
      });
    }

    const buyerRefunds = await this.prisma.$queryRaw<
      { buyer_profile_id: string; cnt: bigint }[]
    >`
      SELECT o.buyer_profile_id, COUNT(r.id)::bigint AS cnt
      FROM order_refunds r
      JOIN orders o ON o.id = r.order_id
      WHERE r.created_at >= ${since} AND r.status = 'REFUNDED'
      GROUP BY o.buyer_profile_id
      HAVING COUNT(r.id) >= 5
      LIMIT 20
    `;
    for (const row of buyerRefunds) {
      await this.alerts.raiseFraudAlert({
        alertType: FinanceAlertType.FRAUD_HIGH_RISK_BUYER,
        severity: FinanceAlertSeverity.WARNING,
        title: `High refund volume buyer ${row.buyer_profile_id}`,
        message: `Buyer has ${row.cnt} refunds in ${LOOKBACK_DAYS} days`,
        metadata: { buyerProfileId: row.buyer_profile_id, count: Number(row.cnt) },
      });
    }
  }

  private async scanCancellationAbuse(since: Date): Promise<void> {
    const rows = await this.prisma.$queryRaw<
      { buyer_profile_id: string; cnt: bigint }[]
    >`
      SELECT buyer_profile_id, COUNT(id)::bigint AS cnt
      FROM orders
      WHERE created_at >= ${since}
        AND status IN ('CANCELLED_BY_BUYER', 'CANCELLED_BY_MERCHANT', 'CANCELLED_BY_ADMIN')
      GROUP BY buyer_profile_id
      HAVING COUNT(id) >= 10
      LIMIT 20
    `;
    for (const row of rows) {
      await this.alerts.raiseFraudAlert({
        alertType: FinanceAlertType.FRAUD_CANCELLATION_ABUSE,
        severity: FinanceAlertSeverity.INFO,
        title: `Frequent cancellations: buyer ${row.buyer_profile_id}`,
        message: `${row.cnt} cancellations in ${LOOKBACK_DAYS} days`,
        metadata: { buyerProfileId: row.buyer_profile_id },
      });
    }
  }

  private async scanCodFailures(since: Date): Promise<void> {
    const rows = await this.prisma.$queryRaw<
      { buyer_profile_id: string; cnt: bigint }[]
    >`
      SELECT buyer_profile_id, COUNT(id)::bigint AS cnt
      FROM orders
      WHERE created_at >= ${since}
        AND payment_method IN ('COD', 'WALLET_COD')
        AND status = 'DELIVERY_FAILED'
      GROUP BY buyer_profile_id
      HAVING COUNT(id) >= 3
      LIMIT 20
    `;
    for (const row of rows) {
      await this.alerts.raiseFraudAlert({
        alertType: FinanceAlertType.FRAUD_COD_FAILURES,
        severity: FinanceAlertSeverity.WARNING,
        title: `Repeated COD delivery failures`,
        message: `Buyer ${row.buyer_profile_id}: ${row.cnt} failed COD deliveries`,
        metadata: { buyerProfileId: row.buyer_profile_id },
      });
    }
  }

  private async scanCouponFarming(since: Date): Promise<void> {
    const rows = await this.prisma.couponUsage.groupBy({
      by: ['buyerProfileId'],
      where: { createdAt: { gte: since } },
      _count: { id: true },
    });
    for (const row of rows.filter((r) => r._count.id >= 8).slice(0, 15)) {
      await this.alerts.raiseFraudAlert({
        alertType: FinanceAlertType.FRAUD_COUPON_FARMING,
        severity: FinanceAlertSeverity.INFO,
        title: `High coupon usage: ${row.buyerProfileId}`,
        message: `${row._count.id} coupon redemptions in ${LOOKBACK_DAYS} days`,
        metadata: { buyerProfileId: row.buyerProfileId },
      });
    }
  }

  private async scanReferralAbuse(since: Date): Promise<void> {
    const rows = await this.prisma.referral.groupBy({
      by: ['referrerWalletId'],
      where: { createdAt: { gte: since }, status: 'COMPLETED' },
      _count: { id: true },
    });
    for (const row of rows.filter((r) => r._count.id >= 10).slice(0, 10)) {
      await this.alerts.raiseFraudAlert({
        alertType: FinanceAlertType.FRAUD_REFERRAL_ABUSE,
        severity: FinanceAlertSeverity.WARNING,
        title: `Referral farming suspected`,
        message: `Referrer wallet ${row.referrerWalletId}: ${row._count.id} completions`,
        metadata: { referrerWalletId: row.referrerWalletId },
      });
    }
  }

  private async scanWalletAbuse(since: Date): Promise<void> {
    const rows = await this.prisma.walletTransaction.groupBy({
      by: ['walletId'],
      where: {
        createdAt: { gte: since },
        type: 'REFUND',
      },
      _sum: { amount: true },
      _count: { id: true },
    });
    for (const row of rows.filter((r) => r._count.id >= 6).slice(0, 10)) {
      await this.alerts.raiseFraudAlert({
        alertType: FinanceAlertType.FRAUD_WALLET_ABUSE,
        severity: FinanceAlertSeverity.INFO,
        title: `High wallet refund activity`,
        message: `Wallet ${row.walletId}: ${row._count.id} refund credits`,
        metadata: { walletId: row.walletId },
      });
    }
  }

  private async scanAiBillingAbuse(since: Date): Promise<void> {
    const rows = await this.prisma.merchantAiWalletTransaction.groupBy({
      by: ['merchantProfileId'],
      where: { createdAt: { gte: since }, type: 'DEBIT' },
      _count: { id: true },
    });
    for (const row of rows.filter((r) => r._count.id >= 50).slice(0, 10)) {
      await this.alerts.raiseFraudAlert({
        alertType: FinanceAlertType.FRAUD_AI_BILLING_ABUSE,
        severity: FinanceAlertSeverity.INFO,
        title: `High AI wallet usage`,
        message: `Merchant ${row.merchantProfileId}: ${row._count.id} AI debits`,
        metadata: { merchantProfileId: row.merchantProfileId },
      });
    }
  }
}
