import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  DomainEventType,
  LoyaltyTier,
  Prisma,
  WalletLedgerEntryType,
  WalletTransactionType,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { WALLET_LOYALTY_EVENTS } from './wallet-loyalty.events';

type TxClient = Prisma.TransactionClient;

function decimalToNumber(d: Prisma.Decimal | number): number {
  return typeof d === 'number' ? d : Number(d);
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly domainEvents: DomainEventsService,
    private readonly events: EventEmitter2,
  ) {}

  generateReferralCode(): string {
    return `JEB${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  async getOrCreateWallet(buyerProfileId: string, referredByCode?: string) {
    const existing = await this.prisma.buyerWallet.findUnique({
      where: { buyerProfileId },
    });
    if (existing) return existing;

    let referredById: string | undefined;
    if (referredByCode) {
      const referrer = await this.prisma.buyerWallet.findUnique({
        where: { referralCode: referredByCode.toUpperCase() },
      });
      if (referrer && referrer.buyerProfileId !== buyerProfileId) {
        referredById = referrer.id;
      }
    }

    let code = this.generateReferralCode();
    for (let i = 0; i < 5; i++) {
      try {
        return await this.prisma.buyerWallet.create({
          data: {
            buyerProfileId,
            referralCode: code,
            referredById,
          },
        });
      } catch {
        code = this.generateReferralCode();
      }
    }
    throw new Error('Could not generate unique referral code');
  }

  async getWalletSummary(buyerProfileId: string) {
    const wallet = await this.getOrCreateWallet(buyerProfileId);
    const [recentTx, expiringSoon] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.walletTransaction.count({
        where: {
          walletId: wallet.id,
          expiresAt: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), gte: new Date() },
          type: { in: [WalletTransactionType.CREDIT, WalletTransactionType.REWARD_CREDIT] },
        },
      }),
    ]);

    return {
      balance: decimalToNumber(wallet.balance),
      rewardPoints: wallet.rewardPoints,
      tier: wallet.tier,
      referralCode: wallet.referralCode,
      lifetimePoints: wallet.lifetimePoints,
      expiringCreditsCount: expiringSoon,
      transactions: recentTx.map((t) => ({
        id: t.id,
        type: t.type,
        amount: decimalToNumber(t.amount),
        balanceAfter: decimalToNumber(t.balanceAfter),
        description: t.description,
        referenceType: t.referenceType,
        referenceId: t.referenceId,
        expiresAt: t.expiresAt?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }

  async creditWallet(
    tx: TxClient,
    walletId: string,
    amount: number,
    type: WalletTransactionType,
    opts: {
      referenceType?: string;
      referenceId?: string;
      description?: string;
      idempotencyKey?: string;
      createdBy?: string;
      expiresAt?: Date;
    },
  ) {
    if (amount <= 0) throw new BadRequestException('Credit amount must be positive');

    if (opts.idempotencyKey) {
      const dup = await tx.walletTransaction.findUnique({
        where: { idempotencyKey: opts.idempotencyKey },
      });
      if (dup) return dup;
    }

    const wallet = await tx.buyerWallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const before = decimalToNumber(wallet.balance);
    const after = roundMoney(before + amount);

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId,
        type,
        amount,
        balanceAfter: after,
        referenceType: opts.referenceType,
        referenceId: opts.referenceId,
        description: opts.description,
        idempotencyKey: opts.idempotencyKey,
        createdBy: opts.createdBy,
        expiresAt: opts.expiresAt,
      },
    });

    await tx.walletLedgerEntry.create({
      data: {
        walletId,
        transactionId: transaction.id,
        entryType: WalletLedgerEntryType.CREDIT,
        amount,
        balanceBefore: before,
        balanceAfter: after,
        metadata: { type, referenceId: opts.referenceId },
      },
    });

    await tx.buyerWallet.update({
      where: { id: walletId },
      data: { balance: after },
    });

    return transaction;
  }

  async debitWallet(
    tx: TxClient,
    walletId: string,
    amount: number,
    opts: {
      referenceType?: string;
      referenceId?: string;
      description?: string;
      idempotencyKey?: string;
    },
  ) {
    if (amount <= 0) throw new BadRequestException('Debit amount must be positive');

    if (opts.idempotencyKey) {
      const dup = await tx.walletTransaction.findUnique({
        where: { idempotencyKey: opts.idempotencyKey },
      });
      if (dup) return dup;
    }

    const wallet = await tx.buyerWallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const before = decimalToNumber(wallet.balance);
    if (before < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }
    const after = roundMoney(before - amount);

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId,
        type: WalletTransactionType.DEBIT,
        amount,
        balanceAfter: after,
        referenceType: opts.referenceType,
        referenceId: opts.referenceId,
        description: opts.description ?? 'Wallet payment',
        idempotencyKey: opts.idempotencyKey,
      },
    });

    await tx.walletLedgerEntry.create({
      data: {
        walletId,
        transactionId: transaction.id,
        entryType: WalletLedgerEntryType.DEBIT,
        amount,
        balanceBefore: before,
        balanceAfter: after,
        metadata: { referenceId: opts.referenceId },
      },
    });

    await tx.buyerWallet.update({
      where: { id: walletId },
      data: { balance: after },
    });

    return transaction;
  }

  async emitWalletCredited(walletId: string, buyerProfileId: string, amount: number, referenceId?: string) {
    const payload = { walletId, buyerProfileId, amount, referenceId };
    this.events.emit(WALLET_LOYALTY_EVENTS.WALLET_CREDITED, payload);
    void this.domainEvents.emit(
      DomainEventType.WALLET_CREDITED,
      'wallet',
      walletId,
      payload,
      { userId: buyerProfileId },
    );
  }

  async emitWalletDebited(walletId: string, buyerProfileId: string, amount: number, referenceId?: string) {
    const payload = { walletId, buyerProfileId, amount, referenceId };
    this.events.emit(WALLET_LOYALTY_EVENTS.WALLET_DEBITED, payload);
    void this.domainEvents.emit(
      DomainEventType.WALLET_DEBITED,
      'wallet',
      walletId,
      payload,
      { userId: buyerProfileId },
    );
  }

  resolveTier(lifetimePoints: number, thresholds: { silver: number; gold: number; platinum: number }): LoyaltyTier {
    if (lifetimePoints >= thresholds.platinum) return LoyaltyTier.PLATINUM;
    if (lifetimePoints >= thresholds.gold) return LoyaltyTier.GOLD;
    if (lifetimePoints >= thresholds.silver) return LoyaltyTier.SILVER;
    return LoyaltyTier.BRONZE;
  }
}
