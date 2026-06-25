import { Injectable } from '@nestjs/common';
import { MembershipBenefitType, MembershipSubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const PLUS_REWARD_MULTIPLIER = 1.5;

@Injectable()
export class MembershipBenefitService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveBenefits(userId: string) {
    const sub = await this.prisma.membershipSubscription.findFirst({
      where: {
        userId,
        status: MembershipSubscriptionStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      include: { plan: { include: { benefits: true } } },
    });
    return sub?.plan.benefits.map((b) => b.type) ?? [];
  }

  async hasBenefit(userId: string, type: MembershipBenefitType) {
    const benefits = await this.getActiveBenefits(userId);
    return benefits.includes(type);
  }

  async hasFreeDelivery(userId: string) {
    return this.hasBenefit(userId, MembershipBenefitType.FREE_DELIVERY);
  }

  getRewardMultiplier(benefits: MembershipBenefitType[]): number {
    return benefits.includes(MembershipBenefitType.EXTRA_REWARDS) ? PLUS_REWARD_MULTIPLIER : 1;
  }

  async recordUsage(userId: string, benefitType: MembershipBenefitType, orderId?: string) {
    const sub = await this.prisma.membershipSubscription.findFirst({
      where: { userId, status: MembershipSubscriptionStatus.ACTIVE, expiresAt: { gt: new Date() } },
    });
    if (!sub) return null;
    return this.prisma.membershipUsage.create({
      data: { subscriptionId: sub.id, benefitType, orderId },
    });
  }

  async isVipSupport(userId: string) {
    return this.hasBenefit(userId, MembershipBenefitType.VIP_SUPPORT);
  }
}
