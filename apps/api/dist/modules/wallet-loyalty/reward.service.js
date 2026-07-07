"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RewardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const reward_config_service_1 = require("./reward-config.service");
const wallet_service_1 = require("./wallet.service");
const membership_benefit_service_1 = require("../membership/membership-benefit.service");
const wallet_loyalty_events_1 = require("./wallet-loyalty.events");
const client_2 = require("@prisma/client");
let RewardService = RewardService_1 = class RewardService {
    constructor(prisma, config, wallet, domainEvents, events, membershipBenefits) {
        this.prisma = prisma;
        this.config = config;
        this.wallet = wallet;
        this.domainEvents = domainEvents;
        this.events = events;
        this.membershipBenefits = membershipBenefits;
        this.logger = new common_1.Logger(RewardService_1.name);
    }
    computePointsForOrder(spendInr, tier, rules) {
        const base = Math.floor(spendInr / 100) * rules.pointsPer100Inr;
        const multiplier = rules.tierMultipliers[tier] ?? 1;
        return Math.max(0, Math.floor(base * multiplier));
    }
    computePointsDiscount(points, rules) {
        return Math.max(0, points * rules.pointValueInr);
    }
    async redeemPoints(tx, walletId, points, orderId) {
        if (points <= 0)
            return 0;
        const wallet = await tx.buyerWallet.findUnique({ where: { id: walletId } });
        if (!wallet)
            throw new common_1.BadRequestException('Wallet not found');
        if (wallet.rewardPoints < points) {
            throw new common_1.BadRequestException('Insufficient reward points');
        }
        const existing = await tx.rewardTransaction.findUnique({ where: { orderId } });
        if (existing?.type === client_1.RewardTransactionType.REDEEM) {
            return Math.abs(existing.points);
        }
        const after = wallet.rewardPoints - points;
        await tx.rewardTransaction.create({
            data: {
                walletId,
                type: client_1.RewardTransactionType.REDEEM,
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
        this.events.emit(wallet_loyalty_events_1.WALLET_LOYALTY_EVENTS.REWARD_REDEEMED, { walletId, orderId, points, discount });
        return discount;
    }
    async creditPointsForOrder(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { buyerProfile: { include: { wallet: true } } },
        });
        if (!order)
            return;
        const terminal = new Set([
            client_1.OrderStatus.CANCELLED_BY_BUYER,
            client_1.OrderStatus.CANCELLED_BY_MERCHANT,
            client_1.OrderStatus.CANCELLED_BY_ADMIN,
            client_1.OrderStatus.REFUNDED,
            client_1.OrderStatus.PAYMENT_FAILED,
        ]);
        if (terminal.has(order.status))
            return;
        const existing = await this.prisma.rewardTransaction.findUnique({ where: { orderId } });
        if (existing)
            return;
        const buyerWallet = order.buyerProfile.wallet ?? await this.wallet.getOrCreateWallet(order.buyerProfileId);
        const rules = await this.config.getRules();
        const spendBase = Number(order.totalAmount) - Number(order.walletAmountUsed);
        const benefits = await this.membershipBenefits.getActiveBenefits(order.buyerProfile.userId);
        const mult = this.membershipBenefits.getRewardMultiplier(benefits);
        const points = Math.floor(this.computePointsForOrder(spendBase, buyerWallet.tier, rules) * mult);
        if (points <= 0)
            return;
        const newLifetime = buyerWallet.lifetimePoints + points;
        const newTier = this.wallet.resolveTier(newLifetime, rules.tierThresholds);
        const tierUpgraded = newTier !== buyerWallet.tier;
        await this.prisma.$transaction(async (tx) => {
            const after = buyerWallet.rewardPoints + points;
            await tx.rewardTransaction.create({
                data: {
                    walletId: buyerWallet.id,
                    type: client_1.RewardTransactionType.EARN,
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
        this.events.emit(wallet_loyalty_events_1.WALLET_LOYALTY_EVENTS.REWARD_EARNED, {
            walletId: buyerWallet.id,
            orderId,
            points,
            tier: newTier,
        });
        void this.domainEvents.emit(client_1.DomainEventType.REWARD_EARNED, 'order', orderId, { points, buyerProfileId: order.buyerProfileId }, {});
        if (tierUpgraded) {
            this.events.emit(wallet_loyalty_events_1.WALLET_LOYALTY_EVENTS.TIER_UPGRADED, {
                walletId: buyerWallet.id,
                from: buyerWallet.tier,
                to: newTier,
            });
            void this.domainEvents.emit(client_1.DomainEventType.TIER_UPGRADED, 'wallet', buyerWallet.id, { from: buyerWallet.tier, to: newTier }, {});
        }
    }
    async getRewardsSummary(buyerProfileId) {
        const wallet = await this.wallet.getOrCreateWallet(buyerProfileId);
        const rules = await this.config.getRules();
        const history = await this.prisma.rewardTransaction.findMany({
            where: { walletId: wallet.id },
            orderBy: { createdAt: 'desc' },
            take: 30,
        });
        const tier = wallet.tier.toLowerCase();
        const nextThreshold = wallet.tier === client_1.LoyaltyTier.BRONZE
            ? rules.tierThresholds.silver
            : wallet.tier === client_1.LoyaltyTier.SILVER
                ? rules.tierThresholds.gold
                : wallet.tier === client_1.LoyaltyTier.GOLD
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
    async adminAdjustPoints(walletId, points, adminUserId, reason) {
        const wallet = await this.prisma.buyerWallet.findUnique({ where: { id: walletId } });
        if (!wallet)
            throw new common_1.BadRequestException('Wallet not found');
        const after = wallet.rewardPoints + points;
        if (after < 0)
            throw new common_1.BadRequestException('Would result in negative points');
        await this.prisma.$transaction(async (tx) => {
            await tx.rewardTransaction.create({
                data: {
                    walletId,
                    type: client_1.RewardTransactionType.ADJUSTMENT,
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
    async refundWalletForOrder(orderId, actorId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { buyerProfile: { include: { wallet: true } } },
        });
        if (!order?.buyerProfile.wallet)
            return;
        const walletId = order.buyerProfile.wallet.id;
        const walletUsed = Number(order.walletAmountUsed);
        const pointsUsed = order.rewardPointsUsed;
        await this.prisma.$transaction(async (tx) => {
            if (walletUsed > 0) {
                await this.wallet.creditWallet(tx, walletId, walletUsed, client_2.WalletTransactionType.REFUND, {
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
                            type: client_1.RewardTransactionType.ADJUSTMENT,
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
            if (earned?.type === client_1.RewardTransactionType.EARN) {
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
};
exports.RewardService = RewardService;
exports.RewardService = RewardService = RewardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        reward_config_service_1.RewardConfigService,
        wallet_service_1.WalletService,
        domain_events_service_1.DomainEventsService,
        event_emitter_1.EventEmitter2,
        membership_benefit_service_1.MembershipBenefitService])
], RewardService);
//# sourceMappingURL=reward.service.js.map