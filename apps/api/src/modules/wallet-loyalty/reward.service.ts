import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  DomainEventType,
  LoyaltyTier,
  OrderStatus,
  Prisma,
  RewardTransactionType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { RewardConfigService } from './reward-config.service';
import { WalletService } from './wallet.service';
import { MembershipBenefitService } from '../membership/membership-benefit.service';
import { WALLET_LOYALTY_EVENTS } from './wallet-loyalty.events';
import { WalletTransactionType } from '@prisma/client';

type TxClient = Prisma.TransactionClient;

@Injectable()
export class RewardService {
  private readonly logger = new Logger(RewardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: RewardConfigService,
    private readonly wallet: WalletService,
    private readonly domainEvents: DomainEventsService,
    private readonly events: EventEmitter2,
    private readonly membershipBenefits: MembershipBenefitService,
  ) {}

  computePointsForOrder(spendInr: number, tier: LoyaltyTier, rules: Awaited<ReturnType<RewardConfigService['getRules']>>): number {
    const base = Math.floor(spendInr / 100) * rules.pointsPer100Inr;
    const multiplier = rules.tierMultipliers[tier] ?? 1;
    return Math.max(0, Math.floor(base * multiplier));
  }

  computePointsDiscount(points: number, rules: Awaited<ReturnType<RewardConfigService['getRules']>>): number {
    return Math.max(0, points * rules.pointValueInr);
  }

  async redeemPoints(
    tx: TxClient,
    walletId: string,
    points: number,
    orderId: string,
  ): Promise<number> {
    if (points <= 0) return 0;

    const wallet = await tx.buyerWallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new BadRequestException('Wallet not found');
    if (wallet.rewardPoints < points) {
      throw new BadRequestException('Insufficient reward points');
    }

    const existing = await tx.rewardTransaction.findUnique({ where: { orderId } });
    if (existing?.type === RewardTransactionType.REDEEM) {
      return Math.abs(existing.points);
    }

    const after = wallet.rewardPoints - points;
    await tx.rewardTransaction.create({
      data: {
        walletId,
        type: RewardTransactionType.REDEEM,
        points: -points,
        pointsAfter: after,
        orderId,
        description: `Redeemed on order ${orderId}`,
        idempotencyKey: `redeem:${orderId}`,
      },
    });

    await tx.buyerWallet.update({
      where: { id: walletId },
      data: { rewardPoints: after },
    });

    const rules = await this.config.getRules();
    const discount = this.computePointsDiscount(points, rules);

    this.events.emit(WALLET_LOYALTY_EVENTS.REWARD_REDEEMED, { walletId, orderId, points, discount });
    return discount;
  }

  async creditPointsForOrder(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { buyerProfile: { include: { wallet: true } } },
    });
    if (!order) return;

    const terminal = new Set<OrderStatus>([
      OrderStatus.CANCELLED_BY_BUYER,
      OrderStatus.CANCELLED_BY_MERCHANT,
      OrderStatus.CANCELLED_BY_ADMIN,
      OrderStatus.REFUNDED,
      OrderStatus.PAYMENT_FAILED,
    ]);
    if (terminal.has(order.status)) return;

    const existing = await this.prisma.rewardTransaction.findUnique({ where: { orderId } });
    if (existing) return;

    const buyerWallet = order.buyerProfile.wallet ?? await this.wallet.getOrCreateWallet(order.buyerProfileId);
    const rules = await this.config.getRules();

    const spendBase = Number(order.totalAmount) - Number(order.walletAmountUsed);
    const benefits = await this.membershipBenefits.getActiveBenefits(order.buyerProfile.userId);
    const mult = this.membershipBenefits.getRewardMultiplier(benefits);
    const points = Math.floor(this.computePointsForOrder(spendBase, buyerWallet.tier, rules) * mult);
    if (points <= 0) return;

    const newLifetime = buyerWallet.lifetimePoints + points;
    const newTier = this.wallet.resolveTier(newLifetime, rules.tierThresholds);
    const tierUpgraded = newTier !== buyerWallet.tier;

    await this.prisma.$transaction(async (tx) => {
      const after = buyerWallet.rewardPoints + points;
      await tx.rewardTransaction.create({
        data: {
          walletId: buyerWallet.id,
          type: RewardTransactionType.EARN,
          points,
          pointsAfter: after,
          orderId,
          description: `Earned on order ${order.orderNumber}`,
          idempotencyKey: `earn:${orderId}`,
        },
      });

      await tx.buyerWallet.update({
        where: { id: buyerWallet.id },
        data: {
          rewardPoints: after,
          lifetimePoints: newLifetime,
          tier: newTier,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { rewardPointsEarned: points },
      });
    });

    this.events.emit(WALLET_LOYALTY_EVENTS.REWARD_EARNED, {
      walletId: buyerWallet.id,
      orderId,
      points,
      tier: newTier,
    });
    void this.domainEvents.emit(
      DomainEventType.REWARD_EARNED,
      'order',
      orderId,
      { points, buyerProfileId: order.buyerProfileId },
      {},
    );

    if (tierUpgraded) {
      this.events.emit(WALLET_LOYALTY_EVENTS.TIER_UPGRADED, {
        walletId: buyerWallet.id,
        from: buyerWallet.tier,
        to: newTier,
      });
      void this.domainEvents.emit(
        DomainEventType.TIER_UPGRADED,
        'wallet',
        buyerWallet.id,
        { from: buyerWallet.tier, to: newTier },
        {},
      );
    }
  }

  async getRewardsSummary(buyerProfileId: string) {
    const wallet = await this.wallet.getOrCreateWallet(buyerProfileId);
    const rules = await this.config.getRules();
    const history = await this.prisma.rewardTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const tier = wallet.tier.toLowerCase() as 'bronze' | 'silver' | 'gold' | 'platinum';
    const nextThreshold =
      wallet.tier === LoyaltyTier.BRONZE
        ? rules.tierThresholds.silver
        : wallet.tier === LoyaltyTier.SILVER
          ? rules.tierThresholds.gold
          : wallet.tier === LoyaltyTier.GOLD
            ? rules.tierThresholds.platinum
            : rules.tierThresholds.platinum;

    return {
      points: wallet.rewardPoints,
      tier,
      nextTierPoints: nextThreshold,
      lifetimePoints: wallet.lifetimePoints,
      history: history.map((h) => ({
        id: h.id,
        type: h.type,
        points: h.points,
        description: h.description,
        createdAt: h.createdAt.toISOString(),
      })),
    };
  }

  async adminAdjustPoints(walletId: string, points: number, adminUserId: string, reason: string) {
    const wallet = await this.prisma.buyerWallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new BadRequestException('Wallet not found');

    const after = wallet.rewardPoints + points;
    if (after < 0) throw new BadRequestException('Would result in negative points');

    await this.prisma.$transaction(async (tx) => {
      await tx.rewardTransaction.create({
        data: {
          walletId,
          type: RewardTransactionType.ADJUSTMENT,
          points,
          pointsAfter: after,
          description: reason,
          idempotencyKey: `admin-adjust:${walletId}:${Date.now()}`,
        },
      });
      await tx.buyerWallet.update({
        where: { id: walletId },
        data: {
          rewardPoints: after,
          lifetimePoints: points > 0 ? { increment: points } : undefined,
        },
      });
    });
    return { walletId, pointsAfter: after };
  }

  async refundWalletForOrder(orderId: string, actorId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { buyerProfile: { include: { wallet: true } } },
    });
    if (!order?.buyerProfile.wallet) return;

    const walletId = order.buyerProfile.wallet.id;
    const walletUsed = Number(order.walletAmountUsed);
    const pointsUsed = order.rewardPointsUsed;

    await this.prisma.$transaction(async (tx) => {
      if (walletUsed > 0) {
        await this.wallet.creditWallet(tx, walletId, walletUsed, WalletTransactionType.REFUND, {
          referenceType: 'order',
          referenceId: orderId,
          description: `Refund for order ${order.orderNumber}`,
          idempotencyKey: `refund-wallet:${orderId}`,
          createdBy: actorId,
        });
      }

      if (pointsUsed > 0) {
        const w = await tx.buyerWallet.findUnique({ where: { id: walletId } });
        if (w) {
          const after = w.rewardPoints + pointsUsed;
          await tx.rewardTransaction.create({
            data: {
              walletId,
              type: RewardTransactionType.ADJUSTMENT,
              points: pointsUsed,
              pointsAfter: after,
              referenceId: orderId,
              description: `Points restored for cancelled order ${order.orderNumber}`,
              idempotencyKey: `refund-points:${orderId}`,
            },
          });
          await tx.buyerWallet.update({
            where: { id: walletId },
            data: { rewardPoints: after },
          });
        }
      }

      const earned = await tx.rewardTransaction.findUnique({ where: { orderId } });
      if (earned?.type === RewardTransactionType.EARN) {
        const w = await tx.buyerWallet.findUnique({ where: { id: walletId } });
        if (w && w.rewardPoints >= earned.points) {
          await tx.buyerWallet.update({
            where: { id: walletId },
            data: {
              rewardPoints: { decrement: earned.points },
              lifetimePoints: { decrement: earned.points },
            },
          });
        }
      }
    });

    if (walletUsed > 0) {
      await this.wallet.emitWalletCredited(walletId, order.buyerProfileId, walletUsed, orderId);
    }
  }
}
