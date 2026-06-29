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
var FraudActionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudActionService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const fraud_case_service_1 = require("./fraud-case.service");
let FraudActionService = FraudActionService_1 = class FraudActionService {
    constructor(prisma, cases) {
        this.prisma = prisma;
        this.cases = cases;
        this.logger = new common_1.Logger(FraudActionService_1.name);
    }
    async apply(userId, action, reason, adminUserId, idempotencyKey) {
        const key = idempotencyKey ?? `action:${userId}:${action}`;
        const existing = await this.prisma.fraudDecision.findUnique({ where: { idempotencyKey: key } });
        if (existing?.actionTaken)
            return existing;
        await this.cases.recordDecision({
            userId,
            decision: action,
            idempotencyKey: key,
            metadata: { reason, adminUserId },
            actionTaken: true,
        });
        switch (action) {
            case client_1.FraudDecisionAction.WALLET_FREEZE:
                await this.addRestriction(userId, client_1.AccountRestrictionType.WALLET_FREEZE, reason, adminUserId);
                await this.prisma.riskProfile.updateMany({
                    where: { userId },
                    data: { walletFrozen: true },
                });
                break;
            case client_1.FraudDecisionAction.REFERRAL_FREEZE:
                await this.addRestriction(userId, client_1.AccountRestrictionType.REFERRAL_FREEZE, reason, adminUserId);
                await this.prisma.riskProfile.updateMany({
                    where: { userId },
                    data: { referralFrozen: true },
                });
                break;
            case client_1.FraudDecisionAction.COUPON_FREEZE:
                await this.addRestriction(userId, client_1.AccountRestrictionType.COUPON_FREEZE, reason, adminUserId);
                await this.prisma.riskProfile.updateMany({
                    where: { userId },
                    data: { couponFrozen: true },
                });
                break;
            case client_1.FraudDecisionAction.COD_DISABLE:
                await this.addRestriction(userId, client_1.AccountRestrictionType.COD_DISABLE, reason, adminUserId);
                await this.prisma.riskProfile.updateMany({ where: { userId }, data: { codEnabled: false } });
                await this.prisma.buyerProfile.updateMany({ where: { userId }, data: { codEnabled: false } });
                break;
            case client_1.FraudDecisionAction.SOFT_BLOCK:
                await this.addRestriction(userId, client_1.AccountRestrictionType.SOFT_BLOCK, reason, adminUserId);
                await this.prisma.riskProfile.updateMany({
                    where: { userId },
                    data: { status: client_1.RiskProfileStatus.WATCHLIST },
                });
                break;
            case client_1.FraudDecisionAction.HARD_BLOCK:
                await this.addRestriction(userId, client_1.AccountRestrictionType.HARD_BLOCK, reason, adminUserId);
                await this.prisma.riskProfile.updateMany({
                    where: { userId },
                    data: { status: client_1.RiskProfileStatus.BLOCKED },
                });
                await this.prisma.user.update({
                    where: { id: userId },
                    data: { status: client_1.UserStatus.SUSPENDED },
                });
                break;
            case client_1.FraudDecisionAction.MERCHANT_SUSPEND:
                await this.addRestriction(userId, client_1.AccountRestrictionType.MERCHANT_SUSPEND, reason, adminUserId);
                await this.prisma.merchantProfile.updateMany({
                    where: { userId },
                    data: { isBlacklisted: true, blacklistReason: reason, blacklistedAt: new Date(), blacklistedBy: adminUserId },
                });
                break;
            case client_1.FraudDecisionAction.RIDER_SUSPEND:
                await this.addRestriction(userId, client_1.AccountRestrictionType.RIDER_SUSPEND, reason, adminUserId);
                break;
            case client_1.FraudDecisionAction.BLACKLIST:
                await this.apply(userId, client_1.FraudDecisionAction.HARD_BLOCK, reason, adminUserId, `${key}:blacklist`);
                break;
            default:
                break;
        }
        this.logger.log({ userId, action, reason }, 'Fraud action applied');
        return { success: true, action };
    }
    async liftRestriction(restrictionId, adminUserId) {
        return this.prisma.accountRestriction.update({
            where: { id: restrictionId },
            data: { active: false, liftedAt: new Date(), liftedBy: adminUserId },
        });
    }
    async addRestriction(userId, type, reason, appliedBy) {
        const active = await this.prisma.accountRestriction.findFirst({
            where: { userId, restrictionType: type, active: true },
        });
        if (active)
            return active;
        return this.prisma.accountRestriction.create({
            data: { userId, restrictionType: type, reason, appliedBy },
        });
    }
};
exports.FraudActionService = FraudActionService;
exports.FraudActionService = FraudActionService = FraudActionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        fraud_case_service_1.FraudCaseService])
], FraudActionService);
//# sourceMappingURL=fraud-action.service.js.map