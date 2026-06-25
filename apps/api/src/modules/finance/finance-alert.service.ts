import { Injectable } from '@nestjs/common';
import { FinanceAlertSeverity, FinanceAlertStatus, FinanceAlertType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FinanceAlertService {
  constructor(private readonly prisma: PrismaService) {}

  async raiseSettlementFailure(merchantProfileId: string, reason: string): Promise<void> {
    await this.create({
      alertType: FinanceAlertType.SETTLEMENT_FAILURE,
      severity: FinanceAlertSeverity.CRITICAL,
      title: 'Settlement batch failed',
      message: reason,
      metadata: { merchantProfileId },
    });
  }

  async raiseCodMismatch(riderProfileId: string, amount: number): Promise<void> {
    await this.create({
      alertType: FinanceAlertType.COD_MISMATCH,
      severity: FinanceAlertSeverity.WARNING,
      title: 'COD remittance mismatch',
      message: `Rider remittance mismatch of ₹${amount}`,
      metadata: { riderProfileId, amount },
    });
  }

  async checkNegativeMerchantBalances(): Promise<number> {
    const wallets = await this.prisma.merchantWallet.findMany({
      where: { availableBalance: { lt: 0 } },
      include: { merchantProfile: { select: { businessName: true } } },
    });
    for (const w of wallets) {
      await this.create({
        alertType: FinanceAlertType.NEGATIVE_MERCHANT_BALANCE,
        severity: FinanceAlertSeverity.WARNING,
        title: `Negative balance: ${w.merchantProfile.businessName}`,
        message: `Available balance is ₹${Number(w.availableBalance)}`,
        metadata: { merchantProfileId: w.merchantProfileId },
      });
    }
    return wallets.length;
  }

  async checkCodMismatches(): Promise<number> {
    const mismatches = await this.prisma.codReconciliation.count({
      where: { status: 'REJECTED', mismatchAmount: { gt: 0 } },
    });
    if (mismatches > 5) {
      await this.create({
        alertType: FinanceAlertType.COD_MISMATCH,
        severity: FinanceAlertSeverity.WARNING,
        title: 'COD reconciliation mismatches',
        message: `${mismatches} rejected COD remittances with mismatches`,
      });
    }
    return mismatches;
  }

  async listOpen(limit = 50) {
    return this.prisma.financeAlert.findMany({
      where: { status: FinanceAlertStatus.OPEN },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private async create(input: {
    alertType: FinanceAlertType;
    severity: FinanceAlertSeverity;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const recent = await this.prisma.financeAlert.findFirst({
      where: {
        alertType: input.alertType,
        status: FinanceAlertStatus.OPEN,
        title: input.title,
        createdAt: { gte: new Date(Date.now() - 3600000) },
      },
    });
    if (recent) return;

    await this.prisma.financeAlert.create({
      data: {
        alertType: input.alertType,
        severity: input.severity,
        title: input.title,
        message: input.message,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });
  }
}
