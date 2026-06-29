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
exports.MembershipService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let MembershipService = class MembershipService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listPlans() {
        return this.prisma.membershipPlan.findMany({
            where: { active: true },
            include: { benefits: true },
        });
    }
    async getActiveSubscription(userId) {
        return this.prisma.membershipSubscription.findFirst({
            where: {
                userId,
                status: client_1.MembershipSubscriptionStatus.ACTIVE,
                expiresAt: { gt: new Date() },
            },
            include: { plan: { include: { benefits: true } } },
        });
    }
    async subscribe(userId, planId, yearly = false) {
        const plan = await this.prisma.membershipPlan.findUnique({ where: { id: planId, active: true } });
        if (!plan)
            throw new common_1.BadRequestException('Plan not found');
        const buyer = await this.prisma.buyerProfile.findUnique({ where: { userId } });
        const startedAt = new Date();
        const expiresAt = new Date(startedAt);
        if (yearly)
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        else
            expiresAt.setMonth(expiresAt.getMonth() + 1);
        await this.prisma.membershipSubscription.updateMany({
            where: { userId, status: client_1.MembershipSubscriptionStatus.ACTIVE },
            data: { status: client_1.MembershipSubscriptionStatus.CANCELLED },
        });
        return this.prisma.membershipSubscription.create({
            data: {
                userId,
                buyerProfileId: buyer?.id,
                planId,
                status: client_1.MembershipSubscriptionStatus.ACTIVE,
                startedAt,
                expiresAt,
            },
            include: { plan: { include: { benefits: true } } },
        }).then(async (sub) => {
            await this.prisma.marketingEvent.create({
                data: {
                    userId,
                    eventType: client_1.MarketingEventType.ORDER_PLACED,
                    metadata: { journey: 'membership_subscribe', planId, expiresAt: expiresAt.toISOString() },
                },
            });
            return sub;
        });
    }
    async cancel(userId) {
        const sub = await this.getActiveSubscription(userId);
        if (!sub)
            throw new common_1.BadRequestException('No active subscription');
        return this.prisma.membershipSubscription.update({
            where: { id: sub.id },
            data: { status: client_1.MembershipSubscriptionStatus.CANCELLED },
        });
    }
    async renewExpiring() {
        const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        const subs = await this.prisma.membershipSubscription.findMany({
            where: { status: client_1.MembershipSubscriptionStatus.ACTIVE, expiresAt: { lte: soon } },
        });
        for (const sub of subs) {
            await this.prisma.marketingEvent.create({
                data: {
                    userId: sub.userId,
                    eventType: client_1.MarketingEventType.CAMPAIGN_OPEN,
                    metadata: { journey: 'membership_renewal', subscriptionId: sub.id, expiresAt: sub.expiresAt.toISOString() },
                },
            });
        }
        return subs;
    }
};
exports.MembershipService = MembershipService;
exports.MembershipService = MembershipService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MembershipService);
//# sourceMappingURL=membership.service.js.map