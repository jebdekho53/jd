import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface CustomerAgg {
  userId?: string;
  name?: string | null;
  phone: string;
  orderCount: number;
  totalSpent: number;
}

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
        status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.REFUNDED] },
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

    // Merge in walk-in customers captured via in-store bills — a customer who
    // buys both online and in-store should show up as one person, not two, so
    // match by phone (normalizing away the online side's +91 prefix, since
    // offline bills store a bare 10-digit number).
    const normalizePhone = (phone: string) => phone.replace(/^\+91/, '');

    const byPhone = new Map<string, CustomerAgg>();

    for (const g of orderGroups) {
      const p = profileMap.get(g.buyerProfileId);
      if (!p) continue;
      const phone = normalizePhone(p.user.phone);
      byPhone.set(phone, {
        userId: p.userId,
        name: p.name,
        phone,
        orderCount: g._count._all,
        totalSpent: Number(g._sum.totalAmount ?? 0),
      });
    }

    const [offlineGroups, offlineNameRows] = await Promise.all([
      this.prisma.offlineBill.groupBy({
        by: ['customerPhone'],
        where: { storeId: { in: storeIds } },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.offlineBill.findMany({
        where: { storeId: { in: storeIds }, customerName: { not: null } },
        select: { customerPhone: true, customerName: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const offlineNameByPhone = new Map<string, string>();
    for (const row of offlineNameRows) {
      if (row.customerName && !offlineNameByPhone.has(row.customerPhone)) {
        offlineNameByPhone.set(row.customerPhone, row.customerName);
      }
    }

    for (const g of offlineGroups) {
      const phone = normalizePhone(g.customerPhone);
      const existing = byPhone.get(phone);
      if (existing) {
        existing.orderCount += g._count._all;
        existing.totalSpent += Number(g._sum.totalAmount ?? 0);
        if (!existing.name) existing.name = offlineNameByPhone.get(g.customerPhone) ?? existing.name;
      } else {
        byPhone.set(phone, {
          name: offlineNameByPhone.get(g.customerPhone) ?? null,
          phone,
          orderCount: g._count._all,
          totalSpent: Number(g._sum.totalAmount ?? 0),
        });
      }
    }

    const merged = [...byPhone.values()].sort((a, b) => b.totalSpent - a.totalSpent);
    const repeatCustomers = merged.filter((c) => c.orderCount >= 2).slice(0, 20);
    const topSpenders = merged.slice(0, 10);

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

  /** Per-customer order ledger — every order this customer placed at the
   *  merchant's own stores, oldest first, with a running total. */
  async getCustomerLedger(merchantUserId: string, customerUserId: string, storeId?: string) {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { userId: merchantUserId },
      include: { stores: { where: { deletedAt: null }, select: { id: true, name: true } } },
    });
    if (!profile) return { customer: null, entries: [], totalSpent: 0, totalOrders: 0 };

    const storeIds = storeId
      ? profile.stores.filter((s) => s.id === storeId).map((s) => s.id)
      : profile.stores.map((s) => s.id);
    if (storeIds.length === 0) return { customer: null, entries: [], totalSpent: 0, totalOrders: 0 };

    const buyerProfile = await this.prisma.buyerProfile.findUnique({
      where: { userId: customerUserId },
      include: { user: { select: { phone: true } } },
    });
    if (!buyerProfile) return { customer: null, entries: [], totalSpent: 0, totalOrders: 0 };

    const orders = await this.prisma.order.findMany({
      where: { storeId: { in: storeIds }, buyerProfileId: buyerProfile.id },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        status: true,
        totalAmount: true,
        store: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    let running = 0;
    const entries = orders.map((o) => {
      running += Number(o.totalAmount);
      return {
        orderId: o.id,
        orderNumber: o.orderNumber,
        date: o.createdAt,
        storeName: o.store.name,
        status: o.status,
        amount: Number(o.totalAmount),
        runningTotal: running,
      };
    });

    return {
      customer: { name: buyerProfile.name, phone: buyerProfile.user.phone },
      entries: entries.reverse(),
      totalSpent: running,
      totalOrders: entries.length,
    };
  }
}
