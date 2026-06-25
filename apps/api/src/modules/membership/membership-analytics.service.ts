import { Injectable } from '@nestjs/common';
import { MembershipSubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MembershipAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminAnalytics() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [active, expired, plans, usages] = await Promise.all([
      this.prisma.membershipSubscription.count({
        where: { status: MembershipSubscriptionStatus.ACTIVE, expiresAt: { gt: new Date() } },
      }),
      this.prisma.membershipSubscription.count({
        where: { status: MembershipSubscriptionStatus.EXPIRED, updatedAt: { gte: thirtyDaysAgo } },
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

  async getMemberSavings(userId: string) {
    const sub = await this.prisma.membershipSubscription.findFirst({
      where: { userId, status: MembershipSubscriptionStatus.ACTIVE },
      include: { usages: true, plan: true },
    });
    if (!sub) return { savings: 0, usages: 0 };
    const freeDeliveries = sub.usages.filter((u) => u.benefitType === 'FREE_DELIVERY').length;
    return { savings: freeDeliveries * 40, usages: sub.usages.length, plan: sub.plan.name };
  }
}
