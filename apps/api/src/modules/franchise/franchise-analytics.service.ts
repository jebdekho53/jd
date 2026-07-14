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
      this.prisma.riderProfile.count({ where: { status: { in: ['ONLINE', 'ON_DELIVERY'] } } }),
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
      riderCount: riders,
      territories: fp.territories,
      pincodes: fp.territories.flatMap((t) => t.pincodes),
    };
  }
}
