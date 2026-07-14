import { Injectable, Logger } from '@nestjs/common';
import {
  DeliveryStatus,
  MarketingEventType,
  OrderStatus,
  PaymentMethod,
  Prisma,
  RiderStatus,
  StoreStatus,
  WalletTransactionType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  CANCELLED_STATUSES,
  REVENUE_STATUSES,
  decimalToNumber,
  pctChange,
} from '../merchant-dashboard/merchant-dashboard.utils';
import {
  daysAgo,
  istDayRange,
  istHourRange,
  startOfIstDay,
  startOfIstMonth,
  startOfIstWeek,
} from '../../common/utils/ist-day.util';
import { sqlOrderStatusIn } from '../../common/utils/order-status-sql.util';
import type {
  CustomerAnalyticsMetrics,
  ExecutiveMetrics,
  FunnelMetrics,
  GeoAnalyticsMetrics,
  HourlyMetrics,
  InventoryAnalyticsMetrics,
  MerchantRollupMetrics,
  OrderAnalyticsMetrics,
  PlatformDailyMetrics,
  RiderAnalyticsMetrics,
  WalletRewardsMetrics,
} from './analytics-metrics.types';

function dayRange(date: Date): { start: Date; end: Date } {
  return istDayRange(date);
}

function hourRange(date: Date): { start: Date; end: Date } {
  return istHourRange(date);
}

@Injectable()
export class AnalyticsAggregatorService {
  private readonly logger = new Logger(AnalyticsAggregatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async aggregateHourly(bucketAt: Date, storeId?: string): Promise<HourlyMetrics> {
    const { start, end } = hourRange(bucketAt);
    const storeFilter = storeId ? { storeId } : {};

    const [orders, agg] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: start, lt: end }, ...storeFilter } }),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: start, lt: end },
          status: { in: REVENUE_STATUSES },
          ...storeFilter,
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const gmv = decimalToNumber(agg._sum.totalAmount);
    return { orders, gmv, revenue: gmv };
  }

  async aggregatePlatformDaily(date: Date, prevDate?: Date): Promise<PlatformDailyMetrics> {
    const { start, end } = dayRange(date);
    const prev = prevDate ?? new Date(start.getTime() - 86_400_000);
    const prevRange = dayRange(prev);

    const [
      executive,
      orders,
      customers,
      riders,
      geo,
      inventory,
      walletRewards,
      funnel,
      prevGmv,
      prevOrders,
    ] = await Promise.all([
      this.buildExecutive(start, end),
      this.buildOrderAnalytics(start, end),
      this.buildCustomerAnalytics(start, end),
      this.buildRiderAnalytics(start, end),
      this.buildGeoAnalytics(start, end),
      this.buildInventoryAnalytics(),
      this.buildWalletRewards(start, end),
      this.buildFunnel(start, end),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: prevRange.start, lt: prevRange.end }, status: { in: REVENUE_STATUSES } },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.count({ where: { createdAt: { gte: prevRange.start, lt: prevRange.end } } }),
    ]);

    const prevRevenue = decimalToNumber(prevGmv._sum.totalAmount);
    executive.growthPct = {
      gmv: pctChange(executive.gmv, prevRevenue),
      orders: pctChange(executive.orders, prevOrders),
      revenue: pctChange(executive.revenue, prevRevenue),
    };

    return { executive, orders, customers, riders, geo, inventory, walletRewards, funnel };
  }

  async aggregateStoreDaily(storeId: string, date: Date): Promise<MerchantRollupMetrics> {
    const { start, end } = dayRange(date);

    const [revenueAgg, orderCount, items, categories, repeatBuyers, walletUsage, reviews] =
      await Promise.all([
        this.prisma.order.aggregate({
          where: { storeId, createdAt: { gte: start, lt: end }, status: { in: REVENUE_STATUSES } },
          _sum: { totalAmount: true, walletAmountUsed: true, rewardPointsUsed: true },
        }),
        this.prisma.order.count({
          where: { storeId, createdAt: { gte: start, lt: end }, status: { notIn: CANCELLED_STATUSES } },
        }),
        this.prisma.orderItem.groupBy({
          by: ['productId', 'productName'],
          where: {
            order: { storeId, createdAt: { gte: start, lt: end }, status: { in: REVENUE_STATUSES } },
          },
          _sum: { quantity: true, totalPrice: true },
        }),
        this.prisma.$queryRaw<{ category_name: string; revenue: Prisma.Decimal; units: bigint }[]>`
          SELECT COALESCE(c.name, 'Uncategorized') AS category_name,
                 COALESCE(SUM(oi.total_price), 0) AS revenue,
                 COALESCE(SUM(oi.quantity), 0)::bigint AS units
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          JOIN products p ON p.id = oi.product_id
          LEFT JOIN categories c ON c.id = p.category_id
          WHERE o.store_id = ${storeId}
            AND o.created_at >= ${start} AND o.created_at < ${end}
            AND ${sqlOrderStatusIn(Prisma.sql`o.status`, REVENUE_STATUSES)}
          GROUP BY 1 ORDER BY revenue DESC LIMIT 10
        `,
        this.prisma.$queryRaw<{ cnt: bigint }[]>`
          SELECT COUNT(*)::bigint AS cnt FROM (
            SELECT buyer_profile_id FROM orders
            WHERE store_id = ${storeId} AND created_at >= ${start} AND created_at < ${end}
              AND status IN ('DELIVERED', 'COMPLETED')
            GROUP BY buyer_profile_id HAVING COUNT(*) > 1
          ) t
        `,
        this.prisma.order.aggregate({
          where: {
            storeId,
            createdAt: { gte: start, lt: end },
            walletAmountUsed: { gt: 0 },
          },
          _sum: { walletAmountUsed: true },
        }),
        this.prisma.review.findMany({
          where: { storeId, createdAt: { gte: start, lt: end } },
          select: { rating: true, createdAt: true },
        }),
      ]);

    const revenue = decimalToNumber(revenueAgg._sum.totalAmount);
    const sortedItems = [...items].sort(
      (a, b) => decimalToNumber(b._sum.totalPrice) - decimalToNumber(a._sum.totalPrice),
    );
    const productsSold = sortedItems.reduce((s, i) => s + (i._sum.quantity ?? 0), 0);
    const uniqueBuyers = await this.prisma.order.groupBy({
      by: ['buyerProfileId'],
      where: { storeId, createdAt: { gte: start, lt: end }, status: { in: REVENUE_STATUSES } },
    });

    const ratingByDay = new Map<string, { sum: number; count: number }>();
    for (const r of reviews) {
      const d = r.createdAt.toISOString().slice(0, 10);
      const cur = ratingByDay.get(d) ?? { sum: 0, count: 0 };
      cur.sum += r.rating;
      cur.count += 1;
      ratingByDay.set(d, cur);
    }

    return {
      revenue,
      orders: orderCount,
      productsSold,
      topCategories: categories.map((c) => ({
        category: c.category_name,
        revenue: decimalToNumber(c.revenue),
        units: Number(c.units),
      })),
      topProducts: sortedItems.slice(0, 10).map((i) => ({
        productId: i.productId,
        name: i.productName,
        units: i._sum.quantity ?? 0,
        revenue: decimalToNumber(i._sum.totalPrice),
      })),
      repeatCustomers: Number(repeatBuyers[0]?.cnt ?? 0),
      customerLtv: uniqueBuyers.length > 0 ? Math.round((revenue / uniqueBuyers.length) * 100) / 100 : 0,
      walletUsage: decimalToNumber(walletUsage._sum.walletAmountUsed),
      rewardRedemption: revenueAgg._sum.rewardPointsUsed ?? 0,
      storeRatingTrend: [...ratingByDay.entries()].map(([date, v]) => ({
        date,
        rating: Math.round((v.sum / v.count) * 10) / 10,
        count: v.count,
      })),
    };
  }

  private async buildExecutive(start: Date, end: Date): Promise<ExecutiveMetrics> {
    const [
      gmvAgg,
      orderCount,
      activeBuyers,
      activeMerchants,
      activeRiders,
      completed,
      checkouts,
      refunded,
      walletAgg,
      pointsAgg,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { createdAt: { gte: start, lt: end }, status: { in: REVENUE_STATUSES } },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.count({ where: { createdAt: { gte: start, lt: end } } }),
      this.prisma.order.groupBy({
        by: ['buyerProfileId'],
        where: { createdAt: { gte: start, lt: end } },
      }),
      this.prisma.order.groupBy({
        by: ['storeId'],
        where: { createdAt: { gte: start, lt: end }, status: { in: REVENUE_STATUSES } },
      }),
      this.prisma.delivery.groupBy({
        by: ['riderProfileId'],
        where: { assignedAt: { gte: start, lt: end }, riderProfileId: { not: null } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: start, lt: end }, status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] } },
      }),
      this.prisma.checkout.count({ where: { createdAt: { gte: start, lt: end } } }),
      this.prisma.order.count({
        where: { createdAt: { gte: start, lt: end }, status: OrderStatus.REFUNDED },
      }),
      this.prisma.buyerWallet.aggregate({ _sum: { balance: true } }),
      this.prisma.buyerWallet.aggregate({ _sum: { rewardPoints: true } }),
    ]);

    const gmv = decimalToNumber(gmvAgg._sum.totalAmount);
    const conversionRate = checkouts > 0 ? Math.round((completed / checkouts) * 1000) / 10 : 0;
    const aov = completed > 0 ? Math.round((gmv / completed) * 100) / 100 : 0;
    const refundRate = orderCount > 0 ? Math.round((refunded / orderCount) * 1000) / 10 : 0;

    return {
      gmv,
      orders: orderCount,
      revenue: gmv,
      activeBuyers: activeBuyers.length,
      activeMerchants: activeMerchants.length,
      activeRiders: activeRiders.length,
      conversionRate,
      aov,
      refundRate,
      walletLiability: decimalToNumber(walletAgg._sum.balance),
      rewardLiability: pointsAgg._sum.rewardPoints ?? 0,
      growthPct: { gmv: 0, orders: 0, revenue: 0 },
    };
  }

  private async buildOrderAnalytics(start: Date, end: Date): Promise<OrderAnalyticsMetrics> {
    const where = { createdAt: { gte: start, lt: end } };
    const [created, completed, cancelled, returned, payments, deliveries, prepTimes] =
      await Promise.all([
        this.prisma.order.count({ where }),
        this.prisma.order.count({
          where: { ...where, status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] } },
        }),
        this.prisma.order.count({ where: { ...where, status: { in: CANCELLED_STATUSES } } }),
        this.prisma.order.count({ where: { ...where, status: OrderStatus.REFUNDED } }),
        this.prisma.order.groupBy({
          by: ['paymentMethod'],
          where: { ...where, status: { in: REVENUE_STATUSES } },
          _count: { id: true },
        }),
        this.prisma.delivery.findMany({
          where: {
            deliveredAt: { gte: start, lt: end },
            status: DeliveryStatus.DELIVERED,
            assignedAt: { not: null },
          },
          select: { assignedAt: true, deliveredAt: true },
        }),
        this.prisma.order.findMany({
          where: {
            ...where,
            paidAt: { not: null },
            delivery: { pickedUpAt: { not: null } },
          },
          select: { paidAt: true, delivery: { select: { pickedUpAt: true } } },
          take: 500,
        }),
      ]);

    const totalPaid = payments.reduce((s, p) => s + p._count.id, 0);
    const countMethod = (m: PaymentMethod) =>
      payments.find((p) => p.paymentMethod === m)?._count.id ?? 0;
    const pct = (n: number) => (totalPaid > 0 ? Math.round((n / totalPaid) * 1000) / 10 : 0);

    const deliveryDurations = deliveries
      .filter((d) => d.assignedAt && d.deliveredAt)
      .map((d) => (d.deliveredAt!.getTime() - d.assignedAt!.getTime()) / 60_000);
    const prepDurations = prepTimes
      .filter((o) => o.paidAt && o.delivery?.pickedUpAt)
      .map((o) => (o.delivery!.pickedUpAt!.getTime() - o.paidAt!.getTime()) / 60_000);

    const avg = (arr: number[]) =>
      arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    const cod = countMethod(PaymentMethod.COD) + countMethod(PaymentMethod.WALLET_COD);
    const wallet =
      countMethod(PaymentMethod.WALLET) +
      countMethod(PaymentMethod.WALLET_COD) +
      countMethod(PaymentMethod.WALLET_RAZORPAY);
    const razorpay =
      countMethod(PaymentMethod.RAZORPAY) + countMethod(PaymentMethod.WALLET_RAZORPAY);

    return {
      created,
      completed,
      cancelled,
      returned,
      codPct: pct(cod),
      walletPct: pct(wallet),
      razorpayPct: pct(razorpay),
      avgDeliveryMins: avg(deliveryDurations),
      avgPrepMins: avg(prepDurations),
    };
  }

  private async buildCustomerAnalytics(start: Date, end: Date): Promise<CustomerAnalyticsMetrics> {
    const [newBuyers, orderBuyers, walletUsers, tiers, referrals, topSpend] = await Promise.all([
      this.prisma.buyerProfile.count({ where: { createdAt: { gte: start, lt: end } } }),
      this.prisma.order.groupBy({
        by: ['buyerProfileId'],
        where: { createdAt: { gte: start, lt: end }, status: { in: REVENUE_STATUSES } },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.buyerWallet.count({ where: { balance: { gt: 0 } } }),
      this.prisma.buyerWallet.groupBy({ by: ['tier'], _count: { id: true } }),
      this.prisma.referral.groupBy({ by: ['status'], _count: { id: true } }),
      this.prisma.order.groupBy({
        by: ['buyerProfileId'],
        where: { createdAt: { gte: start, lt: end }, status: { in: REVENUE_STATUSES } },
        _sum: { totalAmount: true },
        _count: { id: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10,
      }),
    ]);

    const returning = orderBuyers.filter((b) => b._count.id > 1).length;
    const totalActive = orderBuyers.length;
    const repeatPurchasePct = totalActive > 0 ? Math.round((returning / totalActive) * 1000) / 10 : 0;

    const priorBuyers = await this.prisma.order.groupBy({
      by: ['buyerProfileId'],
      where: { createdAt: { lt: start }, status: { in: REVENUE_STATUSES } },
    });
    const priorSet = new Set(priorBuyers.map((b) => b.buyerProfileId));
    const returningCustomers = orderBuyers.filter((b) => priorSet.has(b.buyerProfileId)).length;
    const retentionPct =
      priorSet.size > 0 ? Math.round((returningCustomers / priorSet.size) * 1000) / 10 : 0;

    const profiles = await this.prisma.buyerProfile.findMany({
      where: { id: { in: topSpend.map((t) => t.buyerProfileId) } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(profiles.map((p) => [p.id, p.name]));

    return {
      newCustomers: newBuyers,
      returningCustomers,
      retentionPct,
      repeatPurchasePct,
      topCustomers: topSpend.map((t) => ({
        name: nameMap.get(t.buyerProfileId) ?? 'Buyer',
        orders: t._count.id,
        spend: decimalToNumber(t._sum.totalAmount),
      })),
      walletUsers,
      tierDistribution: tiers.map((t) => ({ tier: t.tier, count: t._count.id })),
      referralPerformance: {
        completed: referrals.find((r) => r.status === 'COMPLETED')?._count.id ?? 0,
        pending: referrals.find((r) => r.status === 'PENDING')?._count.id ?? 0,
      },
    };
  }

  private async buildRiderAnalytics(start: Date, end: Date): Promise<RiderAnalyticsMetrics> {
    const deliveries = await this.prisma.delivery.findMany({
      where: {
        deliveredAt: { gte: start, lt: end },
        status: DeliveryStatus.DELIVERED,
      },
      select: {
        riderProfileId: true,
        assignedAt: true,
        deliveredAt: true,
        estimatedMins: true,
        distanceKm: true,
        order: { select: { totalAmount: true } },
        riderProfile: { select: { name: true } },
      },
    });

    const durations = deliveries
      .filter((d) => d.assignedAt && d.deliveredAt)
      .map((d) => (d.deliveredAt!.getTime() - d.assignedAt!.getTime()) / 60_000);
    const avgDeliveryMins = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    const [assignments, rejections] = await Promise.all([
      this.prisma.deliveryAssignment.count({ where: { offeredAt: { gte: start, lt: end } } }),
      this.prisma.deliveryAssignment.count({
        where: { offeredAt: { gte: start, lt: end }, status: 'REJECTED' },
      }),
    ]);

    const acceptanceRate =
      assignments > 0 ? Math.round(((assignments - rejections) / assignments) * 1000) / 10 : 100;
    const rejectionRate = assignments > 0 ? Math.round((rejections / assignments) * 1000) / 10 : 0;

    const riderMap = new Map<string, { deliveries: number; late: number; name: string }>();
    for (const d of deliveries) {
      if (!d.riderProfileId) continue;
      const cur = riderMap.get(d.riderProfileId) ?? {
        deliveries: 0,
        late: 0,
        name: d.riderProfile?.name ?? 'Rider',
      };
      cur.deliveries += 1;
      if (d.estimatedMins && d.assignedAt && d.deliveredAt) {
        const actual = (d.deliveredAt.getTime() - d.assignedAt.getTime()) / 60_000;
        if (actual > d.estimatedMins + 10) cur.late += 1;
      }
      riderMap.set(d.riderProfileId, cur);
    }

    const sorted = [...riderMap.entries()].sort((a, b) => b[1].deliveries - a[1].deliveries);

    return {
      deliveriesCompleted: deliveries.length,
      avgDeliveryMins,
      acceptanceRate,
      rejectionRate,
      activeHours: Math.round(deliveries.length * 0.5),
      distanceCoveredKm: Math.round(
        deliveries.reduce((s, d) => s + (d.distanceKm ?? 0), 0) * 10,
      ) / 10,
      revenueGenerated: Math.round(
        deliveries.reduce((s, d) => s + decimalToNumber(d.order?.totalAmount), 0) * 100,
      ) / 100,
      topRiders: sorted.slice(0, 10).map(([riderId, v]) => ({
        riderId,
        name: v.name,
        deliveries: v.deliveries,
      })),
      lowPerformingRiders: sorted
        .filter(([, v]) => v.deliveries >= 3)
        .slice(-5)
        .map(([riderId, v]) => ({
          riderId,
          name: v.name,
          deliveries: v.deliveries,
          lateRate: v.deliveries > 0 ? Math.round((v.late / v.deliveries) * 100) : 0,
        })),
    };
  }

  private async buildGeoAnalytics(start: Date, end: Date): Promise<GeoAnalyticsMetrics> {
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: start, lt: end },
        status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
      },
      select: {
        deliveryLat: true,
        deliveryLng: true,
        totalAmount: true,
        store: { select: { city: { select: { name: true } }, locality: true, line2: true } },
      },
      take: 3000,
    });

    const cityMap = new Map<string, { count: number; revenue: number }>();
    const areaMap = new Map<string, { count: number; revenue: number }>();
    const localityMap = new Map<string, { count: number; revenue: number }>();
    const grid = new Map<string, number>();
    const heatmap: { lat: number; lng: number; weight: number }[] = [];

    for (const o of orders) {
      const amt = decimalToNumber(o.totalAmount);
      const city = o.store.city?.name ?? 'Unknown';
      const area = o.store.line2 ?? o.store.locality ?? 'Unknown';
      const locality = o.store.locality ?? 'Unknown';

      for (const [map, key] of [
        [cityMap, city],
        [areaMap, area],
        [localityMap, locality],
      ] as const) {
        const cur = map.get(key) ?? { count: 0, revenue: 0 };
        map.set(key, { count: cur.count + 1, revenue: cur.revenue + amt });
      }

      const gk = `${o.deliveryLat.toFixed(2)},${o.deliveryLng.toFixed(2)}`;
      grid.set(gk, (grid.get(gk) ?? 0) + 1);
      heatmap.push({ lat: o.deliveryLat, lng: o.deliveryLng, weight: 1 });
    }

    const top = (m: Map<string, { count: number; revenue: number }>) =>
      [...m.entries()]
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const [storeCount, riderCount] = await Promise.all([
      this.prisma.store.count({ where: { status: StoreStatus.APPROVED, deletedAt: null } }),
      this.prisma.riderProfile.count({
        where: { status: { in: [RiderStatus.ONLINE, RiderStatus.BUSY, RiderStatus.ON_DELIVERY] } },
      }),
    ]);

    const highDemand = [...grid.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({ key, count }));

    const lowCoverage = highDemand.slice(-5).map((z) => ({
      key: z.key,
      storeCount: Math.max(1, Math.floor(storeCount / 20)),
      orderCount: z.count,
    }));

    return {
      topCities: top(cityMap),
      topAreas: top(areaMap),
      topLocalities: top(localityMap),
      highDemandZones: highDemand,
      lowCoverageZones: lowCoverage,
      deliveryHeatmap: heatmap.slice(0, 500),
      storeDensity: storeCount,
      riderDensity: riderCount,
    };
  }

  private async buildInventoryAnalytics(): Promise<InventoryAnalyticsMetrics> {
    const [fast, slow, lowStock, dead, totals] = await Promise.all([
      this.prisma.inventory.findMany({
        orderBy: { soldQty: 'desc' },
        take: 10,
        include: { variant: { select: { product: { select: { name: true } } } } },
      }),
      this.prisma.inventory.findMany({
        where: { soldQty: 0, availableQty: { gt: 0 } },
        orderBy: { availableQty: 'desc' },
        take: 10,
        include: { variant: { select: { product: { select: { name: true } } } } },
      }),
      this.prisma.inventory.count({ where: { availableQty: { lte: 5 }, status: 'ACTIVE' } }),
      this.prisma.inventory.count({ where: { soldQty: 0, availableQty: { gt: 20 } } }),
      this.prisma.inventory.aggregate({ _sum: { soldQty: true, availableQty: true } }),
    ]);

    const sold = totals._sum.soldQty ?? 0;
    const avail = totals._sum.availableQty ?? 1;
    const turnover = Math.round((sold / avail) * 100) / 100;

    return {
      fastMoving: fast.map((i) => ({ name: i.variant.product.name, soldQty: i.soldQty })),
      slowMoving: slow.map((i) => ({ name: i.variant.product.name, availableQty: i.availableQty })),
      lowStockRisk: lowStock,
      deadInventory: dead,
      inventoryTurnover: turnover,
      lostSalesOos: lowStock * 3,
    };
  }

  private async buildWalletRewards(start: Date, end: Date): Promise<WalletRewardsMetrics> {
    const [credits, debits, walletAgg, pointsAgg, referrals, tierEvents, expired] =
      await Promise.all([
        this.prisma.walletTransaction.aggregate({
          where: {
            createdAt: { gte: start, lt: end },
            type: { in: [WalletTransactionType.CREDIT, WalletTransactionType.REFUND, WalletTransactionType.ADMIN_ADJUSTMENT] },
            amount: { gt: 0 },
          },
          _sum: { amount: true },
        }),
        this.prisma.walletTransaction.aggregate({
          where: {
            createdAt: { gte: start, lt: end },
            type: WalletTransactionType.DEBIT,
          },
          _sum: { amount: true },
        }),
        this.prisma.buyerWallet.aggregate({ _sum: { balance: true } }),
        this.prisma.buyerWallet.aggregate({ _sum: { rewardPoints: true, lifetimePoints: true } }),
        this.prisma.referral.groupBy({ by: ['status'], _count: { id: true } }),
        this.prisma.domainEvent.count({
          where: { eventType: 'TIER_UPGRADED', occurredAt: { gte: start, lt: end } },
        }),
        this.prisma.rewardTransaction.count({
          where: { createdAt: { gte: start, lt: end }, type: 'EXPIRE' },
        }),
      ]);

    const [issued, redeemed] = await Promise.all([
      this.prisma.rewardTransaction.aggregate({
        where: { createdAt: { gte: start, lt: end }, type: 'EARN' },
        _sum: { points: true },
      }),
      this.prisma.rewardTransaction.aggregate({
        where: { createdAt: { gte: start, lt: end }, type: 'REDEEM' },
        _sum: { points: true },
      }),
    ]);

    return {
      walletCredits: decimalToNumber(credits._sum.amount),
      walletDebits: decimalToNumber(debits._sum.amount),
      outstandingLiability: decimalToNumber(walletAgg._sum.balance),
      rewardIssued: issued._sum.points ?? 0,
      rewardRedeemed: redeemed._sum.points ?? 0,
      rewardExpired: expired,
      referralPerformance: {
        completed: referrals.find((r) => r.status === 'COMPLETED')?._count.id ?? 0,
        pending: referrals.find((r) => r.status === 'PENDING')?._count.id ?? 0,
      },
      tierUpgrades: tierEvents,
    };
  }

  private async buildFunnel(start: Date, end: Date): Promise<FunnelMetrics> {
    const range = { gte: start, lt: end };
    const eventCount = (eventType: MarketingEventType) =>
      this.prisma.marketingEvent.count({ where: { eventType, createdAt: range } });

    const [
      distinctSessions,
      searches,
      storeViews,
      productViews,
      addToCart,
      checkouts,
      ordersCreated,
      ordersCompleted,
    ] = await Promise.all([
      // Reach = distinct sessions that produced any tracked storefront event.
      this.prisma.marketingEvent.findMany({
        where: { createdAt: range, sessionId: { not: null } },
        distinct: ['sessionId'],
        select: { sessionId: true },
      }),
      eventCount(MarketingEventType.SEARCH),
      eventCount(MarketingEventType.VIEW_STORE),
      eventCount(MarketingEventType.VIEW_PRODUCT),
      eventCount(MarketingEventType.ADD_CART),
      this.prisma.checkout.count({ where: { createdAt: range } }),
      this.prisma.order.count({ where: { createdAt: range } }),
      this.prisma.order.count({
        where: {
          createdAt: range,
          status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
        },
      }),
    ]);

    const steps = {
      visitors: distinctSessions.length,
      searches,
      storeViews,
      productViews,
      addToCart,
      checkoutStarted: checkouts,
      orderCreated: ordersCreated,
      orderCompleted: ordersCompleted,
    };

    const dropOffPct: Record<string, number> = {};
    const keys = Object.keys(steps) as (keyof typeof steps)[];
    for (let i = 1; i < keys.length; i++) {
      const prev = steps[keys[i - 1]];
      const cur = steps[keys[i]];
      dropOffPct[`${keys[i - 1]}_to_${keys[i]}`] =
        prev > 0 ? Math.round(((prev - cur) / prev) * 1000) / 10 : 0;
    }

    return { ...steps, dropOffPct };
  }
}
