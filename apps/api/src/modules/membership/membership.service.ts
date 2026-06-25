import { BadRequestException, Injectable } from '@nestjs/common';
import { MarketingEventType, MembershipSubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

  async listPlans() {
    return this.prisma.membershipPlan.findMany({
      where: { active: true },
      include: { benefits: true },
    });
  }

  async getActiveSubscription(userId: string) {
    return this.prisma.membershipSubscription.findFirst({
      where: {
        userId,
        status: MembershipSubscriptionStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      include: { plan: { include: { benefits: true } } },
    });
  }

  async subscribe(userId: string, planId: string, yearly = false) {
    const plan = await this.prisma.membershipPlan.findUnique({ where: { id: planId, active: true } });
    if (!plan) throw new BadRequestException('Plan not found');

    const buyer = await this.prisma.buyerProfile.findUnique({ where: { userId } });
    const startedAt = new Date();
    const expiresAt = new Date(startedAt);
    if (yearly) expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);

    await this.prisma.membershipSubscription.updateMany({
      where: { userId, status: MembershipSubscriptionStatus.ACTIVE },
      data: { status: MembershipSubscriptionStatus.CANCELLED },
    });

    return this.prisma.membershipSubscription.create({
      data: {
        userId,
        buyerProfileId: buyer?.id,
        planId,
        status: MembershipSubscriptionStatus.ACTIVE,
        startedAt,
        expiresAt,
      },
      include: { plan: { include: { benefits: true } } },
    }).then(async (sub) => {
      await this.prisma.marketingEvent.create({
        data: {
          userId,
          eventType: MarketingEventType.ORDER_PLACED,
          metadata: { journey: 'membership_subscribe', planId, expiresAt: expiresAt.toISOString() },
        },
      });
      return sub;
    });
  }

  async cancel(userId: string) {
    const sub = await this.getActiveSubscription(userId);
    if (!sub) throw new BadRequestException('No active subscription');
    return this.prisma.membershipSubscription.update({
      where: { id: sub.id },
      data: { status: MembershipSubscriptionStatus.CANCELLED },
    });
  }

  async renewExpiring() {
    const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const subs = await this.prisma.membershipSubscription.findMany({
      where: { status: MembershipSubscriptionStatus.ACTIVE, expiresAt: { lte: soon } },
    });
    for (const sub of subs) {
      await this.prisma.marketingEvent.create({
        data: {
          userId: sub.userId,
          eventType: MarketingEventType.CAMPAIGN_OPEN,
          metadata: { journey: 'membership_renewal', subscriptionId: sub.id, expiresAt: sub.expiresAt.toISOString() },
        },
      });
    }
    return subs;
  }
}
