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
var ReferralService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const domain_events_service_1 = require("../domain-events/domain-events.service");
const fraud_service_1 = require("./fraud.service");
const trust_safety_hook_service_1 = require("../trust-safety/trust-safety-hook.service");
const reward_config_service_1 = require("./reward-config.service");
const reward_service_1 = require("./reward.service");
const wallet_service_1 = require("./wallet.service");
const wallet_loyalty_events_1 = require("./wallet-loyalty.events");
let ReferralService = ReferralService_1 = class ReferralService {
    constructor(prisma, config, wallet, reward, fraud, trustSafety, domainEvents, events) {
        this.prisma = prisma;
        this.config = config;
        this.wallet = wallet;
        this.reward = reward;
        this.fraud = fraud;
        this.trustSafety = trustSafety;
        this.domainEvents = domainEvents;
        this.events = events;
        this.logger = new common_1.Logger(ReferralService_1.name);
    }
    async applyReferralCode(buyerProfileId, code, deviceFingerprint) {
        const referredWallet = await this.wallet.getOrCreateWallet(buyerProfileId);
        if (referredWallet.referredById) {
            throw new common_1.BadRequestException('Referral already applied');
        }
        const referrer = await this.prisma.buyerWallet.findUnique({
            where: { referralCode: code.toUpperCase() },
        });
        if (!referrer)
            throw new common_1.BadRequestException('Invalid referral code');
        if (referrer.buyerProfileId === buyerProfileId) {
            await this.fraud.flagSelfReferral(referredWallet.id);
            throw new common_1.BadRequestException('Cannot use your own referral code');
        }
        if (deviceFingerprint && referrer.deviceFingerprint === deviceFingerprint) {
            await this.fraud.flagDuplicateDevice(referredWallet.id, deviceFingerprint);
            throw new common_1.BadRequestException('Referral not allowed from this device');
        }
        const trustCheck = await this.trustSafety.beforeReferralApply({
            buyerProfileId,
            referrerWalletId: referrer.id,
            referredWalletId: referredWallet.id,
            referralCode: code.toUpperCase(),
            fingerprint: deviceFingerprint,
        });
        if (!trustCheck.allowed) {
            throw new common_1.BadRequestException(trustCheck.reason ?? 'Referral not allowed');
        }
        const existing = await this.prisma.referral.findUnique({
            where: { referredWalletId: referredWallet.id },
        });
        if (existing)
            return existing;
        return this.prisma.$transaction(async (tx) => {
            await tx.buyerWallet.update({
                where: { id: referredWallet.id },
                data: {
                    referredById: referrer.id,
                    ...(deviceFingerprint && { deviceFingerprint }),
                },
            });
            return tx.referral.create({
                data: {
                    referrerWalletId: referrer.id,
                    referredWalletId: referredWallet.id,
                    status: client_1.ReferralStatus.PENDING,
                    deviceFingerprint,
                },
            });
        });
    }
    async completeReferralOnFirstOrder(buyerProfileId, orderId) {
        const wallet = await this.prisma.buyerWallet.findUnique({
            where: { buyerProfileId },
        });
        if (!wallet?.referredById)
            return;
        const referral = await this.prisma.referral.findUnique({
            where: { referredWalletId: wallet.id },
        });
        if (!referral || referral.status !== client_1.ReferralStatus.PENDING)
            return;
        const priorOrders = await this.prisma.order.count({
            where: {
                buyerProfileId,
                id: { not: orderId },
                status: { in: ['DELIVERED', 'COMPLETED'] },
            },
        });
        if (priorOrders > 0)
            return;
        const rules = await this.config.getRules();
        const { referral: refRewards } = rules;
        await this.prisma.$transaction(async (tx) => {
            await tx.referral.update({
                where: { id: referral.id },
                data: {
                    status: client_1.ReferralStatus.COMPLETED,
                    completedAt: new Date(),
                    referrerRewardPoints: refRewards.referrerPoints,
                    referredRewardPoints: refRewards.referredPoints,
                    referrerWalletCredit: refRewards.referrerWalletCredit,
                    referredWalletCredit: refRewards.referredWalletCredit,
                },
            });
            if (refRewards.referrerWalletCredit > 0) {
                await this.wallet.creditWallet(tx, referral.referrerWalletId, refRewards.referrerWalletCredit, client_1.WalletTransactionType.REWARD_CREDIT, {
                    referenceType: 'referral',
                    referenceId: referral.id,
                    description: 'Referral bonus',
                    idempotencyKey: `referral-credit-referrer:${referral.id}`,
                });
            }
            if (refRewards.referredWalletCredit > 0) {
                await this.wallet.creditWallet(tx, referral.referredWalletId, refRewards.referredWalletCredit, client_1.WalletTransactionType.REWARD_CREDIT, {
                    referenceType: 'referral',
                    referenceId: referral.id,
                    description: 'Welcome referral bonus',
                    idempotencyKey: `referral-credit-referred:${referral.id}`,
                });
            }
        });
        this.events.emit(wallet_loyalty_events_1.WALLET_LOYALTY_EVENTS.REFERRAL_COMPLETED, {
            referralId: referral.id,
            orderId,
            referrerWalletId: referral.referrerWalletId,
            referredWalletId: referral.referredWalletId,
        });
        void this.domainEvents.emit(client_1.DomainEventType.REFERRAL_COMPLETED, 'referral', referral.id, { orderId, buyerProfileId }, {});
    }
    async getReferralSummary(buyerProfileId) {
        const wallet = await this.wallet.getOrCreateWallet(buyerProfileId);
        const referrals = await this.prisma.referral.findMany({
            where: { referrerWalletId: wallet.id, status: client_1.ReferralStatus.COMPLETED },
        });
        const earnings = referrals.reduce((sum, r) => sum + Number(r.referrerWalletCredit ?? 0), 0);
        return {
            code: wallet.referralCode,
            inviteCount: referrals.length,
            earnings,
            pendingCount: await this.prisma.referral.count({
                where: { referrerWalletId: wallet.id, status: client_1.ReferralStatus.PENDING },
            }),
        };
    }
};
exports.ReferralService = ReferralService;
exports.ReferralService = ReferralService = ReferralService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        reward_config_service_1.RewardConfigService,
        wallet_service_1.WalletService,
        reward_service_1.RewardService,
        fraud_service_1.FraudService,
        trust_safety_hook_service_1.TrustSafetyHookService,
        domain_events_service_1.DomainEventsService, typeof (_a = typeof event_emitter_1.EventEmitter2 !== "undefined" && event_emitter_1.EventEmitter2) === "function" ? _a : Object])
], ReferralService);
//# sourceMappingURL=referral.service.js.map