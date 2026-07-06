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
var WalletService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../database/prisma.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const wallet_loyalty_events_1 = require("./wallet-loyalty.events");
function decimalToNumber(d) {
    return typeof d === 'number' ? d : Number(d);
}
function roundMoney(n) {
    return Math.round(n * 100) / 100;
}
let WalletService = WalletService_1 = class WalletService {
    constructor(prisma, domainEvents, events) {
        this.prisma = prisma;
        this.domainEvents = domainEvents;
        this.events = events;
        this.logger = new common_1.Logger(WalletService_1.name);
    }
    generateReferralCode() {
        return `JEB${(0, crypto_1.randomBytes)(4).toString('hex').toUpperCase()}`;
    }
    async getOrCreateWallet(buyerProfileId, referredByCode) {
        const existing = await this.prisma.buyerWallet.findUnique({
            where: { buyerProfileId },
        });
        if (existing)
            return existing;
        let referredById;
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
            }
            catch {
                code = this.generateReferralCode();
            }
        }
        throw new Error('Could not generate unique referral code');
    }
    async getWalletSummary(buyerProfileId) {
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
                    type: { in: [client_1.WalletTransactionType.CREDIT, client_1.WalletTransactionType.REWARD_CREDIT] },
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
    async creditWallet(tx, walletId, amount, type, opts) {
        if (amount <= 0)
            throw new common_1.BadRequestException('Credit amount must be positive');
        if (opts.idempotencyKey) {
            const dup = await tx.walletTransaction.findUnique({
                where: { idempotencyKey: opts.idempotencyKey },
            });
            if (dup)
                return dup;
        }
        const wallet = await tx.buyerWallet.findUnique({ where: { id: walletId } });
        if (!wallet)
            throw new common_1.NotFoundException('Wallet not found');
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
                entryType: client_1.WalletLedgerEntryType.CREDIT,
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
    async debitWallet(tx, walletId, amount, opts) {
        if (amount <= 0)
            throw new common_1.BadRequestException('Debit amount must be positive');
        if (opts.idempotencyKey) {
            const dup = await tx.walletTransaction.findUnique({
                where: { idempotencyKey: opts.idempotencyKey },
            });
            if (dup)
                return dup;
        }
        const wallet = await tx.buyerWallet.findUnique({ where: { id: walletId } });
        if (!wallet)
            throw new common_1.NotFoundException('Wallet not found');
        const before = decimalToNumber(wallet.balance);
        if (before < amount) {
            throw new common_1.BadRequestException('Insufficient wallet balance');
        }
        const after = roundMoney(before - amount);
        const transaction = await tx.walletTransaction.create({
            data: {
                walletId,
                type: client_1.WalletTransactionType.DEBIT,
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
                entryType: client_1.WalletLedgerEntryType.DEBIT,
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
    async emitWalletCredited(walletId, buyerProfileId, amount, referenceId) {
        const payload = { walletId, buyerProfileId, amount, referenceId };
        this.events.emit(wallet_loyalty_events_1.WALLET_LOYALTY_EVENTS.WALLET_CREDITED, payload);
        void this.domainEvents.emit(client_1.DomainEventType.WALLET_CREDITED, 'wallet', walletId, payload, { userId: buyerProfileId });
    }
    async emitWalletDebited(walletId, buyerProfileId, amount, referenceId) {
        const payload = { walletId, buyerProfileId, amount, referenceId };
        this.events.emit(wallet_loyalty_events_1.WALLET_LOYALTY_EVENTS.WALLET_DEBITED, payload);
        void this.domainEvents.emit(client_1.DomainEventType.WALLET_DEBITED, 'wallet', walletId, payload, { userId: buyerProfileId });
    }
    resolveTier(lifetimePoints, thresholds) {
        if (lifetimePoints >= thresholds.platinum)
            return client_1.LoyaltyTier.PLATINUM;
        if (lifetimePoints >= thresholds.gold)
            return client_1.LoyaltyTier.GOLD;
        if (lifetimePoints >= thresholds.silver)
            return client_1.LoyaltyTier.SILVER;
        return client_1.LoyaltyTier.BRONZE;
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = WalletService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        domain_events_service_1.DomainEventsService, typeof (_a = typeof event_emitter_1.EventEmitter2 !== "undefined" && event_emitter_1.EventEmitter2) === "function" ? _a : Object])
], WalletService);
//# sourceMappingURL=wallet.service.js.map