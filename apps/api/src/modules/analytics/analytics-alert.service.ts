import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsAlertSeverity, AnalyticsAlertStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { PlatformDailyMetrics } from './analytics-metrics.types';
import { RiderStatus } from '@prisma/client';

@Injectable()
export class AnalyticsAlertService {
  private readonly logger = new Logger(AnalyticsAlertService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listOpen(limit = 50) {
    return this.prisma.analyticsAlert.findMany({
      where: { status: { in: [AnalyticsAlertStatus.OPEN, AnalyticsAlertStatus.ACKNOWLEDGED] } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async acknowledge(id: string) {
    return this.prisma.analyticsAlert.update({
      where: { id },
      data: { status: AnalyticsAlertStatus.ACKNOWLEDGED },
    });
  }

  async evaluateAfterDailySnapshot(metrics: PlatformDailyMetrics, date: Date) {
    const checks = [
      this.checkOrderSpike(metrics),
      this.checkRevenueDrop(metrics),
      this.checkRiderAvailability(),
      this.checkInventoryCrisis(metrics),
      this.checkWalletFraud(metrics),
      this.checkReferralFraud(metrics),
      this.checkMerchantPerformance(metrics),
    ];
    await Promise.all(checks);
    this.logger.log(`Alert evaluation completed for ${date.toISOString().slice(0, 10)}`);
  }

  private async raise(
    alertType: string,
    severity: AnalyticsAlertSeverity,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
  ) {
    const recent = await this.prisma.analyticsAlert.findFirst({
      where: {
        alertType,
        status: AnalyticsAlertStatus.OPEN,
        createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      },
    });
    if (recent) return;

    await this.prisma.analyticsAlert.create({
      data: { alertType, severity, title, message, metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined },
    });
  }

  private async checkOrderSpike(metrics: PlatformDailyMetrics) {
    const growth = metrics.executive.growthPct.orders;
    if (growth >= 80) {
      await this.raise(
        'ORDER_SPIKE',
        AnalyticsAlertSeverity.WARNING,
        'Order volume spike',
        `Orders grew ${growth}% vs prior day (${metrics.executive.orders} orders).`,
        { growth, orders: metrics.executive.orders },
      );
    }
  }

  private async checkRevenueDrop(metrics: PlatformDailyMetrics) {
    const growth = metrics.executive.growthPct.revenue;
    if (growth <= -25 && metrics.executive.revenue > 0) {
      await this.raise(
        'REVENUE_DROP',
        AnalyticsAlertSeverity.CRITICAL,
        'Revenue drop detected',
        `Revenue declined ${Math.abs(growth)}% vs prior day.`,
        { growth, revenue: metrics.executive.revenue },
      );
    }
  }

  private async checkRiderAvailability() {
    const online = await this.prisma.riderProfile.count({
      where: { status: { in: [RiderStatus.ONLINE, RiderStatus.BUSY, RiderStatus.ON_DELIVERY] } },
    });
    const unassigned = await this.prisma.order.count({
      where: { status: 'READY_FOR_PICKUP' },
    });
    if (unassigned >= 5 && online < 3) {
      await this.raise(
        'LOW_RIDER_AVAILABILITY',
        AnalyticsAlertSeverity.CRITICAL,
        'Low rider availability',
        `${unassigned} orders waiting with only ${online} active riders.`,
        { unassigned, online },
      );
    }
  }

  private async checkInventoryCrisis(metrics: PlatformDailyMetrics) {
    if (metrics.inventory.lowStockRisk >= 50) {
      await this.raise(
        'INVENTORY_CRISIS',
        AnalyticsAlertSeverity.WARNING,
        'Inventory crisis risk',
        `${metrics.inventory.lowStockRisk} SKUs at low stock.`,
        { lowStockRisk: metrics.inventory.lowStockRisk },
      );
    }
  }

  private async checkWalletFraud(metrics: PlatformDailyMetrics) {
    const pending = await this.prisma.walletFraudReview.count({ where: { status: 'PENDING' } });
    if (pending >= 10) {
      await this.raise(
        'WALLET_FRAUD_SPIKE',
        AnalyticsAlertSeverity.CRITICAL,
        'Wallet fraud review spike',
        `${pending} pending wallet fraud reviews.`,
        { pending },
      );
    }
    if (metrics.walletRewards.walletDebits > metrics.walletRewards.walletCredits * 2 && metrics.walletRewards.walletDebits > 10000) {
      await this.raise(
        'WALLET_FRAUD_SPIKE',
        AnalyticsAlertSeverity.WARNING,
        'Unusual wallet debit volume',
        `Wallet debits (₹${metrics.walletRewards.walletDebits}) exceed credits.`,
      );
    }
  }

  private async checkReferralFraud(metrics: PlatformDailyMetrics) {
    const flagged = await this.prisma.referral.count({ where: { status: 'FRAUD_FLAGGED' } });
    if (flagged >= 5) {
      await this.raise(
        'REFERRAL_FRAUD_SPIKE',
        AnalyticsAlertSeverity.WARNING,
        'Referral fraud flagged',
        `${flagged} referrals flagged for fraud.`,
        { flagged },
      );
    }
  }

  private async checkMerchantPerformance(metrics: PlatformDailyMetrics) {
    if (metrics.executive.activeMerchants > 0 && metrics.executive.growthPct.orders < -30) {
      await this.raise(
        'MERCHANT_PERFORMANCE_DROP',
        AnalyticsAlertSeverity.WARNING,
        'Merchant performance drop',
        `Order growth at ${metrics.executive.growthPct.orders}% with ${metrics.executive.activeMerchants} active merchants.`,
      );
    }
  }
}
