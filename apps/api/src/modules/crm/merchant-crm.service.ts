import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MerchantCrmService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomers(userId: string, storeId?: string) {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { userId },
      include: { stores: { where: { deletedAt: null }, select: { id: true, name: true } } },
    });
    if (!profile) return { repeatCustomers: [], topSpenders: [], loyaltyMembers: [], winBack: [], couponUsers: [], campaignPerformance: [] };

    const storeIds = storeId
      ? profile.stores.filter((s) => s.id === storeId).map((s) => s.id)
      : profile.stores.map((s) => s.id);

    if (storeIds.length === 0) {
      return { repeatCustomers: [], topSpenders: [], loyaltyMembers: [], winBack: [], couponUsers: [], campaignPerformance: [] };
    }

    const since90 = new Date(Date.now() - 90 * 86400000);
    const since60 = new Date(Date.now() - 60 * 86400000);

    const orderGroups = await this.prisma.order.groupBy({
      by: ['buyerProfileId'],
      where: {
        storeId: { in: storeIds },
        status: { in: [OrderStatus.DELIVERED, OrderStatus.REFUNDED] },
      },
      _count: { _all: true },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 100,
    });

    const profileIds = orderGroups.map((g) => g.buyerProfileId);
    const profiles = await this.prisma.buyerProfile.findMany({
      where: { id: { in: profileIds } },
      include: {
        user: { select: { id: true, phone: true } },
        wallet: { select: { tier: true, rewardPoints: true } },
      },
    });
    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    const repeatCustomers = orderGroups
      .filter((g) => g._count._all >= 2)
      .slice(0, 20)
      .map((g) => {
        const p = profileMap.get(g.buyerProfileId);
        return {
          userId: p?.userId,
          name: p?.name,
          phone: p?.user.phone,
          orderCount: g._count._all,
          totalSpent: Number(g._sum.totalAmount ?? 0),
        };
      });

    const topSpenders = orderGroups.slice(0, 10).map((g) => {
      const p = profileMap.get(g.buyerProfileId);
      return {
        userId: p?.userId,
        name: p?.name,
        phone: p?.user.phone,
        totalSpent: Number(g._sum.totalAmount ?? 0),
        orderCount: g._count._all,
      };
    });

    const loyaltyMembers = profiles
      .filter((p) => p.wallet && ['GOLD', 'PLATINUM'].includes(p.wallet.tier))
      .slice(0, 20)
      .map((p) => ({
        userId: p.userId,
        name: p.name,
        phone: p.user.phone,
        tier: p.wallet!.tier,
        points: p.wallet!.rewardPoints,
      }));

    const recentBuyers = await this.prisma.order.findMany({
      where: { storeId: { in: storeIds }, createdAt: { gte: since90 } },
      select: { buyerProfileId: true },
      distinct: ['buyerProfileId'],
    });
    const recentSet = new Set(recentBuyers.map((o) => o.buyerProfileId));

    const dormantOrders = await this.prisma.order.groupBy({
      by: ['buyerProfileId'],
      where: { storeId: { in: storeIds } },
      _max: { createdAt: true },
    });

    const winBack = dormantOrders
      .filter((d) => d._max.createdAt && d._max.createdAt < since60 && !recentSet.has(d.buyerProfileId))
      .slice(0, 20)
      .map((d) => {
        const p = profileMap.get(d.buyerProfileId);
        return {
          userId: p?.userId,
          name: p?.name,
          phone: p?.user.phone,
          lastOrderAt: d._max.createdAt,
        };
      })
      .filter((w) => w.userId);

    const couponOrders = await this.prisma.order.findMany({
      where: {
        storeId: { in: storeIds },
        OR: [{ couponId: { not: null } }, { discountAmount: { gt: 0 } }],
      },
      select: { buyerProfileId: true },
      distinct: ['buyerProfileId'],
      take: 50,
    });

    const couponUsers = couponOrders.map((o) => {
      const p = profileMap.get(o.buyerProfileId);
      return { userId: p?.userId, name: p?.name, phone: p?.user.phone };
    }).filter((c) => c.userId);

    const campaigns = await this.prisma.campaign.findMany({
      where: { storeId: { in: storeIds } },
      select: {
        id: true,
        name: true,
        status: true,
        impressionCount: true,
        clickCount: true,
        orderCount: true,
        spentAmount: true,
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return {
      repeatCustomers,
      topSpenders,
      loyaltyMembers,
      winBack,
      couponUsers,
      campaignPerformance: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        impressions: c.impressionCount,
        clicks: c.clickCount,
        redemptions: c.orderCount,
        spent: Number(c.spentAmount),
      })),
    };
  }
}
