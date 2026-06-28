import { Injectable } from '@nestjs/common';
import {
  DeliveryStatus,
  KycStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  RiderStatus,
  RoleName,
  StoreStatus,
  UserStatus,
  CheckoutStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { sqlOrderStatusNotIn } from '../../common/utils/order-status-sql.util';
import { orderIstDayFilter } from '../../common/utils/ist-day.util';
import {
  CANCELLED_STATUSES,
  REVENUE_STATUSES,
  daysAgo,
  decimalToNumber,
  startOfIstDay,
  startOfIstMonth,
} from '../merchant-dashboard/merchant-dashboard.utils';
import {
  AdminDashboardOrdersQueryDto,
  AdminDashboardStoresQueryDto,
} from './dto/admin-dashboard-query.dto';
import { unassignedOrderWhere } from '../rider-assignment/rider-assignment.util';

const PLATFORM_USER_ROLES: RoleName[] = [RoleName.BUYER, RoleName.MERCHANT, RoleName.RIDER];

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private countUsersWithRole(role: RoleName) {
    return this.prisma.user.count({
      where: {
        deletedAt: null,
        roles: { some: { role: { name: role } } },
      },
    });
  }

  private countPlatformUsers() {
    return this.prisma.user.count({
      where: {
        deletedAt: null,
        roles: { some: { role: { name: { in: PLATFORM_USER_ROLES } } } },
      },
    });
  }

  async getOverview() {
    const todayStart = startOfIstDay();
    const monthStart = startOfIstMonth();

    const [
      totalOrders,
      ordersToday,
      gmvToday,
      gmvMonth,
      storeCounts,
      riderCounts,
      totalUsers,
      totalBuyers,
      totalMerchants,
      totalRiders,
      totalStores,
      cancelledToday,
      failedPayments,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: todayStart },
          status: { in: REVENUE_STATUSES },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: monthStart },
          status: { in: REVENUE_STATUSES },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.store.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.riderProfile.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.countPlatformUsers(),
      this.countUsersWithRole(RoleName.BUYER),
      this.countUsersWithRole(RoleName.MERCHANT),
      this.countUsersWithRole(RoleName.RIDER),
      this.prisma.store.count({ where: { deletedAt: null } }),
      this.prisma.order.count({
        where: { createdAt: { gte: todayStart }, status: { in: CANCELLED_STATUSES } },
      }),
      this.prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
    ]);

    const activeStores =
      storeCounts.find((s) => s.status === StoreStatus.APPROVED)?._count.id ?? 0;
    const approvedStores = activeStores;
    const rejectedStores =
      storeCounts.find((s) => s.status === StoreStatus.REJECTED)?._count.id ?? 0;
    const pendingStores = storeCounts
      .filter((s) =>
        (
          [
            StoreStatus.PENDING_REVIEW,
            StoreStatus.UNDER_REVIEW,
            StoreStatus.DOCUMENTS_REQUIRED,
          ] as StoreStatus[]
        ).includes(s.status),
      )
      .reduce((sum, s) => sum + s._count.id, 0);

    const onlineRiders = riderCounts
      .filter((r) =>
        ([RiderStatus.ONLINE, RiderStatus.BUSY, RiderStatus.ON_DELIVERY] as RiderStatus[]).includes(
          r.status,
        ),
      )
      .reduce((sum, r) => sum + r._count.id, 0);
    const activeRiders = riderCounts.reduce((sum, r) => sum + r._count.id, 0);

    const newUsersToday = await this.prisma.user.count({
      where: {
        createdAt: { gte: todayStart },
        deletedAt: null,
        roles: { some: { role: { name: { in: PLATFORM_USER_ROLES } } } },
      },
    });

    const gmvTodayVal = decimalToNumber(gmvToday._sum.totalAmount);
    const gmvMonthVal = decimalToNumber(gmvMonth._sum.totalAmount);

    return {
      totalOrders,
      ordersToday,
      gmvToday: gmvTodayVal,
      gmvThisMonth: gmvMonthVal,
      totalUsers,
      totalBuyers,
      totalMerchants,
      totalRiders,
      totalStores,
      activeStores,
      approvedStores,
      pendingStores,
      rejectedStores,
      activeRiders,
      onlineRiders,
      newUsersToday,
      cancelledOrdersToday: cancelledToday,
      failedPayments,
      platformRevenue: gmvMonthVal,
      storeStatusBreakdown: Object.fromEntries(
        storeCounts.map((s) => [s.status, s._count.id]),
      ),
    };
  }

  async getOrders(query: AdminDashboardOrdersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = {
      ...(query.storeId ? { storeId: query.storeId } : {}),
      ...(query.today ? orderIstDayFilter({ today: true }) : {}),
      ...(query.status ? { status: query.status as OrderStatus } : {}),
      ...(query.cityId ? { store: { cityId: query.cityId } } : {}),
      ...(query.riderId
        ? { delivery: { riderProfileId: query.riderId } }
        : {}),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          buyerProfile: { select: { name: true } },
          store: {
            select: {
              id: true,
              name: true,
              city: { select: { name: true } },
              merchantProfile: { select: { businessName: true } },
            },
          },
          delivery: {
            select: {
              estimatedMins: true,
              riderProfile: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        buyer: o.buyerProfile.name,
        store: o.store.name,
        storeId: o.store.id,
        merchant: o.store.merchantProfile.businessName,
        city: o.store.city.name,
        rider: o.delivery?.riderProfile?.name ?? null,
        riderId: o.delivery?.riderProfile?.id ?? null,
        amount: decimalToNumber(o.totalAmount),
        status: o.status,
        createdAt: o.createdAt.toISOString(),
        deliveryEta: o.delivery?.estimatedMins ?? null,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getStores(query: AdminDashboardStoresQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.StoreWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status as StoreStatus } : {}),
    };

    const [stores, total, statusCounts] = await Promise.all([
      this.prisma.store.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          status: true,
          submittedAt: true,
          merchantProfile: {
            select: { businessName: true, gstNumber: true, kycStatus: true },
          },
          verificationDocuments: { select: { documentType: true } },
        },
      }),
      this.prisma.store.count({ where }),
      this.prisma.store.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
    ]);

    return {
      summary: Object.fromEntries(statusCounts.map((s) => [s.status, s._count.id])),
      stores: stores.map((s) => ({
        id: s.id,
        name: s.name,
        merchant: s.merchantProfile.businessName,
        gst: s.merchantProfile.gstNumber,
        kycStatus: s.merchantProfile.kycStatus,
        status: s.status,
        appliedAt: s.submittedAt?.toISOString() ?? null,
        documentCount: s.verificationDocuments.length,
        riskScore: this.computeStoreRiskScore(s),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private computeStoreRiskScore(store: {
    status: StoreStatus;
    merchantProfile: { kycStatus: KycStatus; gstNumber: string | null };
    verificationDocuments: { documentType: string }[];
  }): number {
    let score = 0;
    if (store.status === StoreStatus.REJECTED) score += 40;
    if (store.merchantProfile.kycStatus === KycStatus.REJECTED) score += 30;
    if (!store.merchantProfile.gstNumber) score += 15;
    if (store.verificationDocuments.length < 2) score += 15;
    return Math.min(100, score);
  }

  async getRiders() {
    const [riders, statusCounts, pendingKyc] = await Promise.all([
      this.prisma.riderProfile.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          kycStatus: true,
          user: { select: { phone: true } },
          deliveries: {
            where: {
              status: {
                in: [
                  DeliveryStatus.ASSIGNED,
                  DeliveryStatus.ACCEPTED,
                  DeliveryStatus.PICKED_UP,
                  DeliveryStatus.IN_TRANSIT,
                ],
              },
            },
            take: 1,
            select: { order: { select: { orderNumber: true } } },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
      this.prisma.riderProfile.groupBy({ by: ['status'], _count: { id: true } }),
      this.prisma.riderProfile.count({
        where: { kycStatus: { in: [KycStatus.PENDING, KycStatus.SUBMITTED] } },
      }),
    ]);

    const countBy = (statuses: RiderStatus[]) =>
      statusCounts
        .filter((r) => statuses.includes(r.status))
        .reduce((s, r) => s + r._count.id, 0);

    return {
      online: countBy([RiderStatus.ONLINE, RiderStatus.BUSY, RiderStatus.ON_DELIVERY]),
      offline: countBy([RiderStatus.OFFLINE]),
      busy: countBy([RiderStatus.BUSY, RiderStatus.ON_DELIVERY]),
      available: countBy([RiderStatus.ONLINE]),
      pendingKyc,
      rejectedKyc: await this.prisma.riderProfile.count({
        where: { kycStatus: KycStatus.REJECTED },
      }),
      riders: riders.map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.user.phone,
        status: r.status,
        kycStatus: r.kycStatus,
        currentOrder: r.deliveries[0]?.order.orderNumber ?? null,
      })),
    };
  }

  async getUnassignedOrders() {
    const orders = await this.prisma.order.findMany({
      where: unassignedOrderWhere(),
      orderBy: { createdAt: 'asc' },
      take: 30,
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        totalAmount: true,
        store: {
          select: {
            name: true,
            storeZones: { select: { zone: { select: { name: true } } }, take: 1 },
          },
        },
      },
    });

    const availableRiders = await this.prisma.riderProfile.count({
      where: { status: RiderStatus.ONLINE },
    });

    return {
      count: orders.length,
      availableRiders,
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        store: o.store.name,
        zone: o.store.storeZones[0]?.zone.name ?? '—',
        amount: decimalToNumber(o.totalAmount),
        waitingSince: o.createdAt.toISOString(),
      })),
    };
  }

  async getPayments() {
    const todayStart = startOfIstDay();
    const [cod, paid, failed, refunded, dailyRevenue] = await Promise.all([
      this.prisma.order.count({
        where: { paymentMethod: PaymentMethod.COD, createdAt: { gte: todayStart } },
      }),
      this.prisma.payment.count({
        where: { status: PaymentStatus.PAID, createdAt: { gte: todayStart } },
      }),
      this.prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.REFUNDED } }),
      this.prisma.$queryRaw<{ day: Date; revenue: Prisma.Decimal }[]>`
        SELECT date_trunc('day', created_at) AS day,
               COALESCE(SUM(total_amount), 0) AS revenue
        FROM orders
        WHERE created_at >= ${daysAgo(7)}
          AND ${sqlOrderStatusNotIn(CANCELLED_STATUSES)}
        GROUP BY 1 ORDER BY 1
      `,
    ]);

    return {
      codOrdersToday: cod,
      paidOrdersToday: paid,
      failedPayments: failed,
      refunds: refunded,
      revenueTrend: dailyRevenue.map((r) => ({
        date: r.day.toISOString().slice(0, 10),
        revenue: decimalToNumber(r.revenue),
      })),
    };
  }

  async getCustomers() {
    const todayStart = startOfIstDay();
    const since30 = daysAgo(30);

    const buyerRoleFilter = {
      deletedAt: null,
      roles: { some: { role: { name: RoleName.BUYER } } },
    };

    const [usersToday, activeBuyers, repeatBuyers, suspendedUsers] = await Promise.all([
      this.prisma.user.count({
        where: { ...buyerRoleFilter, createdAt: { gte: todayStart } },
      }),
      this.prisma.user.count({
        where: { ...buyerRoleFilter, status: UserStatus.ACTIVE },
      }),
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count FROM (
          SELECT buyer_profile_id FROM orders
          WHERE created_at >= ${since30}
          GROUP BY buyer_profile_id HAVING COUNT(*) > 1
        ) t
      `,
      this.prisma.user.count({
        where: {
          deletedAt: null,
          status: UserStatus.SUSPENDED,
          roles: { some: { role: { name: { in: PLATFORM_USER_ROLES } } } },
        },
      }),
    ]);

    return {
      usersToday,
      activeUsers: activeBuyers,
      repeatBuyers: Number(repeatBuyers[0]?.count ?? 0),
      suspiciousUsers: suspendedUsers,
      refundRequests: await this.prisma.payment.count({
        where: { status: PaymentStatus.REFUNDED, updatedAt: { gte: since30 } },
      }),
    };
  }

  async getCategories() {
    const [
      parentCount,
      subCount,
      requestsByStatus,
      topByProducts,
      storesPerCategory,
    ] = await Promise.all([
      this.prisma.category.count({
        where: { scope: 'GLOBAL', deletedAt: null, parentId: null },
      }),
      this.prisma.category.count({
        where: { scope: 'GLOBAL', deletedAt: null, parentId: { not: null } },
      }),
      this.prisma.storeCategoryRequest.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.product.groupBy({
        by: ['categoryId'],
        where: { deletedAt: null, categoryId: { not: null }, isActive: true },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.storeCategory.groupBy({
        by: ['categoryId'],
        _count: { storeId: true },
        orderBy: { _count: { storeId: 'desc' } },
        take: 10,
      }),
    ]);

    const categoryIds = [
      ...topByProducts.map((u) => u.categoryId!),
      ...storesPerCategory.map((s) => s.categoryId),
    ];
    const categoryNames = await this.prisma.category.findMany({
      where: { id: { in: [...new Set(categoryIds)] } },
      select: { id: true, name: true },
    });

    const requestMap = Object.fromEntries(
      requestsByStatus.map((r) => [r.status, r._count.id]),
    );

    return {
      totalCategories: parentCount,
      totalSubcategories: subCount,
      categoryRequests: requestMap,
      pendingRequests: requestMap.PENDING ?? 0,
      approvedRequests: requestMap.APPROVED ?? 0,
      topCategories: topByProducts.map((u) => ({
        categoryId: u.categoryId,
        name: categoryNames.find((c) => c.id === u.categoryId)?.name ?? 'Unknown',
        productCount: u._count.id,
      })),
      storesPerCategory: storesPerCategory.map((s) => ({
        categoryId: s.categoryId,
        name: categoryNames.find((c) => c.id === s.categoryId)?.name ?? 'Unknown',
        storeCount: s._count.storeId,
      })),
    };
  }

  async getFraudRisk() {
    const [rejectedMerchants, blockedUsers, failedVerifications, blacklisted] =
      await Promise.all([
        this.prisma.store.count({ where: { status: StoreStatus.REJECTED } }),
        this.prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
        this.prisma.riderProfile.count({ where: { kycStatus: KycStatus.REJECTED } }),
        this.prisma.merchantProfile.count({ where: { isBlacklisted: true } }),
      ]);

    const recentAudit = await this.prisma.auditLog.findMany({
      where: {
        action: {
          in: ['STORE_REJECTED', 'USER_SUSPENDED', 'PAYMENT_FAILED', 'ORDER_CANCELLED_BY_ADMIN'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: {
        id: true,
        action: true,
        resourceType: true,
        createdAt: true,
      },
    });

    return {
      rejectedMerchants,
      blockedUsers,
      failedVerifications,
      duplicateAccounts: blacklisted,
      riskEvents: recentAudit.map((a) => ({
        id: a.id,
        type: a.action,
        resource: a.resourceType,
        at: a.createdAt.toISOString(),
      })),
    };
  }

  async getSystemHealth() {
    let postgres: 'up' | 'down' = 'up';
    let redisStatus: 'up' | 'down' = 'up';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      postgres = 'down';
    }

    try {
      const key = 'health:dashboard';
      await this.redis.set(key, '1', 5);
      const val = await this.redis.get(key);
      if (val !== '1') redisStatus = 'down';
    } catch {
      redisStatus = 'down';
    }

    const pendingCheckouts = await this.prisma.checkout.count({
      where: { status: { in: [CheckoutStatus.INITIATED, CheckoutStatus.RESERVED] } },
    });

    return {
      api: 'up',
      database: postgres,
      redis: redisStatus,
      queueHealth: pendingCheckouts < 100 ? 'healthy' : 'degraded',
      pendingCheckouts,
      websocket: 'unavailable',
      backgroundJobs: 'running',
      cronStatus: 'active',
      sms:
        process.env.AUTH_SMS_ENABLED === 'true' && process.env.MSG91_ENABLED === 'true'
          ? process.env.MSG91_AUTH_KEY
            ? 'configured'
            : 'console'
          : 'disabled',
      whatsapp:
        process.env.AUTH_WHATSAPP_ENABLED === 'true' && process.env.MSG91_ENABLED === 'true'
          ? process.env.MSG91_AUTH_KEY
            ? 'configured'
            : 'console'
          : 'coming_soon',
      email: process.env.SMTP_HOST ? 'configured' : 'console',
      googleMaps: process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'configured' : 'missing',
      shadowfax:
        process.env.ENABLE_SHADOWFAX === 'true' && process.env.SHADOWFAX_API_URL
          ? 'configured'
          : 'disabled',
      pushNotifications: process.env.FCM_SERVER_KEY ? 'configured' : 'not_configured',
    };
  }
}
