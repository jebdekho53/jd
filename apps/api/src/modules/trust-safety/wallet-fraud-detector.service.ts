import { Injectable, Logger } from '@nestjs/common';
import { FraudCaseCategory, FraudDecisionAction, TrustAlertType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FraudActionService } from './fraud-action.service';
import { FraudCaseService } from './fraud-case.service';
import { RiskEngineService } from './risk-engine.service';
import { TrustAlertService } from './trust-alert.service';

@Injectable()
export class WalletFraudDetectorService {
  private readonly logger = new Logger(WalletFraudDetectorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly risk: RiskEngineService,
    private readonly cases: FraudCaseService,
    private readonly actions: FraudActionService,
    private readonly alerts: TrustAlertService,
  ) {}

  async onWalletCredit(walletId: string, amount: number, referenceId?: string) {
    const wallet = await this.prisma.buyerWallet.findUnique({
      where: { id: walletId },
      include: { buyerProfile: { select: { userId: true } } },
    });
    if (!wallet) return;

    const userId = wallet.buyerProfile.userId;
    const key = `wallet-credit:${walletId}:${referenceId ?? amount}`;

    if (amount >= 500) {
      await this.risk.recordEvent({
        userId,
        eventType: 'SUSPICIOUS_WALLET_CREDIT',
        severity: amount >= 2000 ? 'CRITICAL' : 'HIGH',
        idempotencyKey: key,
        metadata: { amount, walletId },
      });

      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCredits = await this.prisma.walletTransaction.count({
        where: { walletId, type: 'REWARD_CREDIT', createdAt: { gte: hourAgo } },
      });
      if (recentCredits >= 5) {
        await this.flagFarming(userId, walletId, recentCredits);
      }
    }

    const profile = await this.risk.getOrCreateProfile(userId);
    if (profile.walletFrozen) {
      this.logger.warn({ walletId, userId }, 'Wallet credit on frozen wallet');
    }
  }

  async onWalletCreated(userId: string) {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const wallets = await this.prisma.buyerWallet.count({
      where: { buyerProfile: { user: { createdAt: { gte: dayAgo } } } },
    });
    if (wallets > 50) {
      await this.alerts.raise(
        TrustAlertType.WALLET_ABUSE,
        'HIGH',
        'Rapid wallet creation',
        'Unusual volume of new wallets in 24h.',
        { count: wallets },
      );
    }
  }

  private async flagFarming(userId: string, walletId: string, count: number) {
    const key = `wallet-farming:${walletId}`;
    const fraudCase = await this.cases.openCase({
      userId,
      category: FraudCaseCategory.WALLET_ABUSE,
      severity: 'HIGH',
      title: 'Wallet farming suspected',
      description: `${count} credits in 1 hour`,
      subjectType: 'wallet',
      subjectId: walletId,
      idempotencyKey: key,
    });
    await this.actions.apply(userId, FraudDecisionAction.WALLET_FREEZE, 'Wallet farming', undefined, key);
    await this.alerts.raise(
      TrustAlertType.WALLET_ABUSE,
      'HIGH',
      'Wallet abuse detected',
      fraudCase.description,
      { caseId: fraudCase.id },
    );
  }
}
