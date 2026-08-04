import { Injectable } from '@nestjs/common';
import { FranchisePartnerStatus, FranchiseStoreStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BUYER_STATUS_GROUPS } from '../order/order-status-groups';

@Injectable()
export class FranchiseAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Partner leaderboard, ranked by commission actually earned.
   *
   * Ranked on settled franchiseShare rather than store count, because a partner with
   * twenty dead stores has earned the platform nothing and a partner with three busy
   * ones has. Parked (PENDING_REVIEW) links are excluded — they earn nothing, so
   * counting them would flatter a partner who has not really been credited.
   */
  async getLeaderboard(limit = 20) {
    const partners = await this.prisma.franchisePartner.findMany({
      where: { status: FranchisePartnerStatus.ACTIVE },
      select: {
        id: true,
        businessName: true,
        referralCode: true,
        city: { select: { name: true } },
        _count: { select: { stores: { where: { status: FranchiseStoreStatus.ACTIVE } } } },
        settlements: { select: { franchiseShare: true, commissionBase: true, grossGmv: true } },
      },
      take: 200,
    });

    const rows = partners
      .map((p) => {
        const earned = p.settlements.reduce((s, x) => s + Number(x.franchiseShare), 0);
        return {
          franchiseId: p.id,
          businessName: p.businessName,
          referralCode: p.referralCode,
          city: p.city?.name ?? null,
          activeStores: p._count.stores,
          gmv: p.settlements.reduce((s, x) => s + Number(x.grossGmv), 0),
          commissionBase: p.settlements.reduce((s, x) => s + Number(x.commissionBase), 0),
          earned: Math.round(earned * 100) / 100,
        };
      })
      .sort((a, b) => b.earned - a.earned || b.activeStores - a.activeStores)
      .slice(0, limit)
      .map((row, i) => ({ rank: i + 1, ...row }));

    return rows;
  }

  /** The partner's own standing — their rank out of everyone, for the portal. */
  async getMyStanding(franchiseId: string) {
    const board = await this.getLeaderboard(200);
    const me = board.find((r) => r.franchiseId === franchiseId);
    return {
      rank: me?.rank ?? null,
      totalPartners: board.length,
      earned: me?.earned ?? 0,
      activeStores: me?.activeStores ?? 0,
      top: board.slice(0, 5),
    };
  }

  async getAdminFranchiseAnalytics() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [franchiseCount, cityPlans, gmvAgg, orders] = await Promise.all([
      this.prisma.franchisePartner.count({ where: { status: 'ACTIVE' } }),
      this.prisma.cityLaunchPlan.findMany({ orderBy: { actualGmv: 'desc' }, take: 10 }),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { notIn: [...BUYER_STATUS_GROUPS.cancelled] },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: thirtyDaysAgo }, status: OrderStatus.DELIVERED },
      }),
    ]);

    const pipeline = await this.prisma.cityLaunchPlan.groupBy({
      by: ['launchStatus'],
      _count: { id: true },
    });

    const franchiseGmv = await this.prisma.franchiseSettlement.aggregate({
      _sum: { grossGmv: true, franchiseShare: true },
    });

    return {
      activeFranchises: franchiseCount,
      platformGmv30d: Number(gmvAgg._sum.totalAmount ?? 0),
      franchiseGmvTotal: Number(franchiseGmv._sum.grossGmv ?? 0),
      franchiseShareTotal: Number(franchiseGmv._sum.franchiseShare ?? 0),
      ordersDelivered30d: orders,
      cityGmv: cityPlans.map((c) => ({
        city: c.city,
        state: c.state,
        gmv: Number(c.actualGmv),
        readinessScore: c.readinessScore,
        launchStatus: c.launchStatus,
      })),
      expansionPipeline: pipeline,
      territoryUtilization: cityPlans.length > 0
        ? Math.round(cityPlans.reduce((s, c) => s + (c.actualStores / Math.max(1, c.targetStores)), 0) / cityPlans.length * 100)
        : 0,
    };
  }

  async getFranchiseDashboard(franchiseId: string) {
    const fp = await this.prisma.franchisePartner.findUnique({
      where: { id: franchiseId },
      include: {
        stores: { include: { store: { select: { id: true, name: true } } } },
        territories: true,
      },
    });
    if (!fp) return null;

    const storeIds = fp.stores.map((s) => s.storeId);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [gmv, orderCount, riders] = await Promise.all([
      storeIds.length > 0
        ? this.prisma.order.aggregate({
            where: {
              storeId: { in: storeIds },
              createdAt: { gte: thirtyDaysAgo },
              status: { notIn: [...BUYER_STATUS_GROUPS.cancelled] },
            },
            _sum: { totalAmount: true },
          })
        : { _sum: { totalAmount: null } },
      storeIds.length > 0
        ? this.prisma.order.count({
            where: { storeId: { in: storeIds }, createdAt: { gte: thirtyDaysAgo } },
          })
        : 0,
      // Distinct riders who actually delivered for THIS franchise's stores in the
      // window — not a platform-wide online-rider count, which told a partner
      // nothing about their own territory.
      storeIds.length > 0
        ? this.prisma.delivery.findMany({
            where: {
              order: { storeId: { in: storeIds } },
              createdAt: { gte: thirtyDaysAgo },
              riderProfileId: { not: null },
            },
            select: { riderProfileId: true },
            distinct: ['riderProfileId'],
          })
        : [],
    ]);

    const gmvNum = Number(gmv._sum.totalAmount ?? 0);
    const revenueShare = gmvNum * (fp.commissionPercent / 100);

    return {
      businessName: fp.businessName,
      status: fp.status,
      gmv30d: gmvNum,
      orders30d: orderCount,
      revenueShare,
      commissionPercent: fp.commissionPercent,
      storeCount: fp.stores.length,
      riderCount: riders.length,
      territories: fp.territories,
      pincodes: fp.territories.flatMap((t) => t.pincodes),
    };
  }

  /**
   * Full profile + 30d performance for every rider who has actually delivered
   * for this franchise's stores — not a platform-wide rider list, which would
   * include riders the partner has no relationship to or visibility into.
   */
  async getFranchiseRiders(franchiseId: string) {
    const fp = await this.prisma.franchisePartner.findUnique({
      where: { id: franchiseId },
      select: { stores: { select: { storeId: true } } },
    });
    if (!fp) return { riders: [], totalRiders: 0 };

    const storeIds = fp.stores.map((s) => s.storeId);
    if (storeIds.length === 0) return { riders: [], totalRiders: 0 };

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const deliveries = await this.prisma.delivery.findMany({
      where: {
        order: { storeId: { in: storeIds } },
        createdAt: { gte: thirtyDaysAgo },
        riderProfileId: { not: null },
      },
      select: { riderProfileId: true, status: true, riderEarning: true },
    });

    const byRider = new Map<string, { deliveries: number; completed: number; earning: number }>();
    for (const d of deliveries) {
      const id = d.riderProfileId as string;
      const cur = byRider.get(id) ?? { deliveries: 0, completed: 0, earning: 0 };
      cur.deliveries += 1;
      if (d.status === 'DELIVERED') cur.completed += 1;
      cur.earning += Number(d.riderEarning ?? 0);
      byRider.set(id, cur);
    }

    const profiles = await this.prisma.riderProfile.findMany({
      where: { id: { in: [...byRider.keys()] } },
      select: {
        id: true,
        name: true,
        vehicleType: true,
        status: true,
        ratingAvg: true,
        ratingCount: true,
        totalDeliveries: true,
        lastLocationAt: true,
      },
    });

    const riders = profiles
      .map((p) => {
        const stats = byRider.get(p.id)!;
        return {
          id: p.id,
          name: p.name,
          vehicleType: p.vehicleType,
          status: p.status,
          ratingAvg: p.ratingAvg,
          ratingCount: p.ratingCount,
          totalDeliveries: p.totalDeliveries,
          lastLocationAt: p.lastLocationAt,
          deliveries30d: stats.deliveries,
          completed30d: stats.completed,
          earning30d: Math.round(stats.earning * 100) / 100,
        };
      })
      .sort((a, b) => b.deliveries30d - a.deliveries30d);

    return { riders, totalRiders: riders.length };
  }
}
