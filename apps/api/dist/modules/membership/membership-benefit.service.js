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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipBenefitService = exports.PLUS_REWARD_MULTIPLIER = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
exports.PLUS_REWARD_MULTIPLIER = 1.5;
let MembershipBenefitService = class MembershipBenefitService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getActiveBenefits(userId) {
        const sub = await this.prisma.membershipSubscription.findFirst({
            where: {
                userId,
                status: client_1.MembershipSubscriptionStatus.ACTIVE,
                expiresAt: { gt: new Date() },
            },
            include: { plan: { include: { benefits: true } } },
        });
        return sub?.plan.benefits.map((b) => b.type) ?? [];
    }
    async hasBenefit(userId, type) {
        const benefits = await this.getActiveBenefits(userId);
        return benefits.includes(type);
    }
    async hasFreeDelivery(userId) {
        return this.hasBenefit(userId, client_1.MembershipBenefitType.FREE_DELIVERY);
    }
    getRewardMultiplier(benefits) {
        return benefits.includes(client_1.MembershipBenefitType.EXTRA_REWARDS) ? exports.PLUS_REWARD_MULTIPLIER : 1;
    }
    async recordUsage(userId, benefitType, orderId) {
        const sub = await this.prisma.membershipSubscription.findFirst({
            where: { userId, status: client_1.MembershipSubscriptionStatus.ACTIVE, expiresAt: { gt: new Date() } },
        });
        if (!sub)
            return null;
        return this.prisma.membershipUsage.create({
            data: { subscriptionId: sub.id, benefitType, orderId },
        });
    }
    async isVipSupport(userId) {
        return this.hasBenefit(userId, client_1.MembershipBenefitType.VIP_SUPPORT);
    }
};
exports.MembershipBenefitService = MembershipBenefitService;
exports.MembershipBenefitService = MembershipBenefitService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MembershipBenefitService);
//# sourceMappingURL=membership-benefit.service.js.map