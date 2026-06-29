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
exports.MembershipAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let MembershipAnalyticsService = class MembershipAnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAdminAnalytics() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [active, expired, plans, usages] = await Promise.all([
            this.prisma.membershipSubscription.count({
                where: { status: client_1.MembershipSubscriptionStatus.ACTIVE, expiresAt: { gt: new Date() } },
            }),
            this.prisma.membershipSubscription.count({
                where: { status: client_1.MembershipSubscriptionStatus.EXPIRED, updatedAt: { gte: thirtyDaysAgo } },
            }),
            this.prisma.membershipPlan.findMany({ include: { subscriptions: { where: { status: 'ACTIVE' } } } }),
            this.prisma.membershipUsage.findMany({
                where: { benefitType: 'FREE_DELIVERY', createdAt: { gte: thirtyDaysAgo } },
                take: 500,
            }),
        ]);
        const mrr = plans.reduce((sum, p) => {
            const subs = p.subscriptions.length;
            return sum + subs * Number(p.monthlyPrice);
        }, 0);
        const churnRate = active + expired > 0 ? Math.round((expired / (active + expired)) * 100) : 0;
        const retention = 100 - churnRate;
        return {
            mrr: Math.round(mrr),
            activeSubscribers: active,
            churnRate,
            retention,
            freeDeliverySavings: usages.length * 40,
        };
    }
    async getMemberSavings(userId) {
        const sub = await this.prisma.membershipSubscription.findFirst({
            where: { userId, status: client_1.MembershipSubscriptionStatus.ACTIVE },
            include: { usages: true, plan: true },
        });
        if (!sub)
            return { savings: 0, usages: 0 };
        const freeDeliveries = sub.usages.filter((u) => u.benefitType === 'FREE_DELIVERY').length;
        return { savings: freeDeliveries * 40, usages: sub.usages.length, plan: sub.plan.name };
    }
};
exports.MembershipAnalyticsService = MembershipAnalyticsService;
exports.MembershipAnalyticsService = MembershipAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MembershipAnalyticsService);
//# sourceMappingURL=membership-analytics.service.js.map