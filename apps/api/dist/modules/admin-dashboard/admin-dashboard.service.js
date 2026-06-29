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
exports.AdminDashboardService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const order_status_sql_util_1 = require("../../common/utils/order-status-sql.util");
const ist_day_util_1 = require("../../common/utils/ist-day.util");
const merchant_dashboard_utils_1 = require("../merchant-dashboard/merchant-dashboard.utils");
const rider_assignment_util_1 = require("../rider-assignment/rider-assignment.util");
const PLATFORM_USER_ROLES = [client_1.RoleName.BUYER, client_1.RoleName.MERCHANT, client_1.RoleName.RIDER];
let AdminDashboardService = class AdminDashboardService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    countUsersWithRole(role) {
        return this.prisma.user.count({
            where: {
                deletedAt: null,
                roles: { some: { role: { name: role } } },
            },
        });
    }
    countPlatformUsers() {
        return this.prisma.user.count({
            where: {
                deletedAt: null,
                roles: { some: { role: { name: { in: PLATFORM_USER_ROLES } } } },
            },
        });
    }
    async getOverview() {
        const todayStart = (0, merchant_dashboard_utils_1.startOfIstDay)();
        const monthStart = (0, merchant_dashboard_utils_1.startOfIstMonth)();
        const [totalOrders, ordersToday, gmvToday, gmvMonth, storeCounts, riderCounts, totalUsers, totalBuyers, totalMerchants, totalRiders, totalStores, cancelledToday, failedPayments,] = await Promise.all([
            this.prisma.order.count(),
            this.prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
            this.prisma.order.aggregate({
                where: {
                    createdAt: { gte: todayStart },
                    status: { in: merchant_dashboard_utils_1.REVENUE_STATUSES },
                },
                _sum: { totalAmount: true },
            }),
            this.prisma.order.aggregate({
                where: {
                    createdAt: { gte: monthStart },
                    status: { in: merchant_dashboard_utils_1.REVENUE_STATUSES },
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
            this.countUsersWithRole(client_1.RoleName.BUYER),
            this.countUsersWithRole(client_1.RoleName.MERCHANT),
            this.countUsersWithRole(client_1.RoleName.RIDER),
            this.prisma.store.count({ where: { deletedAt: null } }),
            this.prisma.order.count({
                where: { createdAt: { gte: todayStart }, status: { in: merchant_dashboard_utils_1.CANCELLED_STATUSES } },
            }),
            this.prisma.payment.count({ where: { status: client_1.PaymentStatus.FAILED } }),
        ]);
        const activeStores = storeCounts.find((s) => s.status === client_1.StoreStatus.APPROVED)?._count.id ?? 0;
        const approvedStores = activeStores;
        const rejectedStores = storeCounts.find((s) => s.status === client_1.StoreStatus.REJECTED)?._count.id ?? 0;
        const pendingStores = storeCounts
            .filter((s) => [
            client_1.StoreStatus.PENDING_REVIEW,
            client_1.StoreStatus.UNDER_REVIEW,
            client_1.StoreStatus.DOCUMENTS_REQUIRED,
        ].includes(s.status))
            .reduce((sum, s) => sum + s._count.id, 0);
        const onlineRiders = riderCounts
            .filter((r) => [client_1.RiderStatus.ONLINE, client_1.RiderStatus.BUSY, client_1.RiderStatus.ON_DELIVERY].includes(r.status))
            .reduce((sum, r) => sum + r._count.id, 0);
        const activeRiders = riderCounts.reduce((sum, r) => sum + r._count.id, 0);
        const newUsersToday = await this.prisma.user.count({
            where: {
                createdAt: { gte: todayStart },
                deletedAt: null,
                roles: { some: { role: { name: { in: PLATFORM_USER_ROLES } } } },
            },
        });
        const gmvTodayVal = (0, merchant_dashboard_utils_1.decimalToNumber)(gmvToday._sum.totalAmount);
        const gmvMonthVal = (0, merchant_dashboard_utils_1.decimalToNumber)(gmvMonth._sum.totalAmount);
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
            storeStatusBreakdown: Object.fromEntries(storeCounts.map((s) => [s.status, s._count.id])),
        };
    }
    async getOrders(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 25;
        const skip = (page - 1) * limit;
        const where = {
            ...(query.storeId ? { storeId: query.storeId } : {}),
            ...(query.today ? (0, ist_day_util_1.orderIstDayFilter)({ today: true }) : {}),
            ...(query.status ? { status: query.status } : {}),
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
                amount: (0, merchant_dashboard_utils_1.decimalToNumber)(o.totalAmount),
                status: o.status,
                createdAt: o.createdAt.toISOString(),
                deliveryEta: o.delivery?.estimatedMins ?? null,
            })),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getStores(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = {
            deletedAt: null,
            ...(query.status ? { status: query.status } : {}),
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
    computeStoreRiskScore(store) {
        let score = 0;
        if (store.status === client_1.StoreStatus.REJECTED)
            score += 40;
        if (store.merchantProfile.kycStatus === client_1.KycStatus.REJECTED)
            score += 30;
        if (!store.merchantProfile.gstNumber)
            score += 15;
        if (store.verificationDocuments.length < 2)
            score += 15;
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
                                    client_1.DeliveryStatus.ASSIGNED,
                                    client_1.DeliveryStatus.ACCEPTED,
                                    client_1.DeliveryStatus.PICKED_UP,
                                    client_1.DeliveryStatus.IN_TRANSIT,
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
                where: { kycStatus: { in: [client_1.KycStatus.PENDING, client_1.KycStatus.SUBMITTED] } },
            }),
        ]);
        const countBy = (statuses) => statusCounts
            .filter((r) => statuses.includes(r.status))
            .reduce((s, r) => s + r._count.id, 0);
        return {
            online: countBy([client_1.RiderStatus.ONLINE, client_1.RiderStatus.BUSY, client_1.RiderStatus.ON_DELIVERY]),
            offline: countBy([client_1.RiderStatus.OFFLINE]),
            busy: countBy([client_1.RiderStatus.BUSY, client_1.RiderStatus.ON_DELIVERY]),
            available: countBy([client_1.RiderStatus.ONLINE]),
            pendingKyc,
            rejectedKyc: await this.prisma.riderProfile.count({
                where: { kycStatus: client_1.KycStatus.REJECTED },
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
            where: (0, rider_assignment_util_1.unassignedOrderWhere)(),
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
            where: { status: client_1.RiderStatus.ONLINE },
        });
        return {
            count: orders.length,
            availableRiders,
            orders: orders.map((o) => ({
                id: o.id,
                orderNumber: o.orderNumber,
                store: o.store.name,
                zone: o.store.storeZones[0]?.zone.name ?? '—',
                amount: (0, merchant_dashboard_utils_1.decimalToNumber)(o.totalAmount),
                waitingSince: o.createdAt.toISOString(),
            })),
        };
    }
    async getPayments() {
        const todayStart = (0, merchant_dashboard_utils_1.startOfIstDay)();
        const [cod, paid, failed, refunded, dailyRevenue] = await Promise.all([
            this.prisma.order.count({
                where: { paymentMethod: client_1.PaymentMethod.COD, createdAt: { gte: todayStart } },
            }),
            this.prisma.payment.count({
                where: { status: client_1.PaymentStatus.PAID, createdAt: { gte: todayStart } },
            }),
            this.prisma.payment.count({ where: { status: client_1.PaymentStatus.FAILED } }),
            this.prisma.payment.count({ where: { status: client_1.PaymentStatus.REFUNDED } }),
            this.prisma.$queryRaw `
        SELECT date_trunc('day', created_at) AS day,
               COALESCE(SUM(total_amount), 0) AS revenue
        FROM orders
        WHERE created_at >= ${(0, merchant_dashboard_utils_1.daysAgo)(7)}
          AND ${(0, order_status_sql_util_1.sqlOrderStatusNotIn)(merchant_dashboard_utils_1.CANCELLED_STATUSES)}
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
                revenue: (0, merchant_dashboard_utils_1.decimalToNumber)(r.revenue),
            })),
        };
    }
    async getCustomers() {
        const todayStart = (0, merchant_dashboard_utils_1.startOfIstDay)();
        const since30 = (0, merchant_dashboard_utils_1.daysAgo)(30);
        const buyerRoleFilter = {
            deletedAt: null,
            roles: { some: { role: { name: client_1.RoleName.BUYER } } },
        };
        const [usersToday, activeBuyers, repeatBuyers, suspendedUsers] = await Promise.all([
            this.prisma.user.count({
                where: { ...buyerRoleFilter, createdAt: { gte: todayStart } },
            }),
            this.prisma.user.count({
                where: { ...buyerRoleFilter, status: client_1.UserStatus.ACTIVE },
            }),
            this.prisma.$queryRaw `
        SELECT COUNT(*)::bigint AS count FROM (
          SELECT buyer_profile_id FROM orders
          WHERE created_at >= ${since30}
          GROUP BY buyer_profile_id HAVING COUNT(*) > 1
        ) t
      `,
            this.prisma.user.count({
                where: {
                    deletedAt: null,
                    status: client_1.UserStatus.SUSPENDED,
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
                where: { status: client_1.PaymentStatus.REFUNDED, updatedAt: { gte: since30 } },
            }),
        };
    }
    async getCategories() {
        const [parentCount, subCount, requestsByStatus, topByProducts, storesPerCategory,] = await Promise.all([
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
            ...topByProducts.map((u) => u.categoryId),
            ...storesPerCategory.map((s) => s.categoryId),
        ];
        const categoryNames = await this.prisma.category.findMany({
            where: { id: { in: [...new Set(categoryIds)] } },
            select: { id: true, name: true },
        });
        const requestMap = Object.fromEntries(requestsByStatus.map((r) => [r.status, r._count.id]));
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
        const [rejectedMerchants, blockedUsers, failedVerifications, blacklisted] = await Promise.all([
            this.prisma.store.count({ where: { status: client_1.StoreStatus.REJECTED } }),
            this.prisma.user.count({ where: { status: client_1.UserStatus.SUSPENDED } }),
            this.prisma.riderProfile.count({ where: { kycStatus: client_1.KycStatus.REJECTED } }),
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
        let postgres = 'up';
        let redisStatus = 'up';
        try {
            await this.prisma.$queryRaw `SELECT 1`;
        }
        catch {
            postgres = 'down';
        }
        try {
            const key = 'health:dashboard';
            await this.redis.set(key, '1', 5);
            const val = await this.redis.get(key);
            if (val !== '1')
                redisStatus = 'down';
        }
        catch {
            redisStatus = 'down';
        }
        const pendingCheckouts = await this.prisma.checkout.count({
            where: { status: { in: [client_1.CheckoutStatus.INITIATED, client_1.CheckoutStatus.RESERVED] } },
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
            sms: process.env.AUTH_SMS_ENABLED === 'true' && process.env.MSG91_ENABLED === 'true'
                ? process.env.MSG91_AUTH_KEY
                    ? 'configured'
                    : 'console'
                : 'disabled',
            whatsapp: process.env.AUTH_WHATSAPP_ENABLED === 'true' && process.env.MSG91_ENABLED === 'true'
                ? process.env.MSG91_AUTH_KEY
                    ? 'configured'
                    : 'console'
                : 'coming_soon',
            email: process.env.SMTP_HOST ? 'configured' : 'console',
            googleMaps: process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'configured' : 'missing',
            shadowfax: process.env.ENABLE_SHADOWFAX === 'true' && process.env.SHADOWFAX_API_URL
                ? 'configured'
                : 'disabled',
            pushNotifications: process.env.FCM_SERVER_KEY ? 'configured' : 'not_configured',
        };
    }
};
exports.AdminDashboardService = AdminDashboardService;
exports.AdminDashboardService = AdminDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], AdminDashboardService);
//# sourceMappingURL=admin-dashboard.service.js.map