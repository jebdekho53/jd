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
var MerchantDashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerchantDashboardService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const merchant_order_visibility_util_1 = require("../order/merchant-order-visibility.util");
const merchant_dashboard_utils_1 = require("./merchant-dashboard.utils");
let MerchantDashboardService = MerchantDashboardService_1 = class MerchantDashboardService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(MerchantDashboardService_1.name);
    }
    async resolveStoreContext(userId, storeId) {
        const profile = await this.prisma.merchantProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!profile) {
            this.logger.warn(`Dashboard access without merchant profile (userId=${userId})`);
            return { storeIds: [], merchantProfileId: null };
        }
        if (storeId) {
            const store = await this.prisma.store.findFirst({
                where: { id: storeId, merchantProfileId: profile.id, deletedAt: null },
                select: { id: true },
            });
            if (!store) {
                throw new common_1.ForbiddenException('Store does not belong to merchant');
            }
            return { storeIds: [store.id], merchantProfileId: profile.id };
        }
        const stores = await this.prisma.store.findMany({
            where: { merchantProfileId: profile.id, deletedAt: null },
            select: { id: true },
        });
        return { storeIds: stores.map((s) => s.id), merchantProfileId: profile.id };
    }
    async getOverview(userId, query) {
        try {
            const { storeIds } = await this.resolveStoreContext(userId, query.storeId);
            if (storeIds.length === 0) {
                this.logger.debug(`Overview: no stores for userId=${userId}, returning defaults`);
                return { ...merchant_dashboard_utils_1.EMPTY_MERCHANT_OVERVIEW };
            }
            const todayStart = (0, merchant_dashboard_utils_1.startOfIstDay)();
            const yesterdayStart = (0, merchant_dashboard_utils_1.daysAgo)(1);
            const baseWhere = { storeId: { in: storeIds } };
            const [todayAgg, yesterdayAgg, statusCounts, storeRating, sparklineRows,] = await Promise.all([
                this.prisma.order.aggregate({
                    where: {
                        ...baseWhere,
                        createdAt: { gte: todayStart },
                        status: { notIn: merchant_dashboard_utils_1.CANCELLED_STATUSES },
                    },
                    _count: { id: true },
                    _sum: { totalAmount: true },
                }),
                this.prisma.order.aggregate({
                    where: {
                        ...baseWhere,
                        createdAt: { gte: yesterdayStart, lt: todayStart },
                        status: { notIn: merchant_dashboard_utils_1.CANCELLED_STATUSES },
                    },
                    _count: { id: true },
                    _sum: { totalAmount: true },
                }),
                this.prisma.order.groupBy({
                    by: ['status'],
                    where: { ...baseWhere, createdAt: { gte: todayStart } },
                    _count: { id: true },
                }),
                this.prisma.store.aggregate({
                    where: { id: { in: storeIds } },
                    _avg: { ratingAvg: true },
                    _sum: { ratingCount: true },
                }),
                this.prisma.$queryRaw `
          SELECT date_trunc('day', created_at) AS day,
                 COUNT(*)::bigint AS orders,
                 COALESCE(SUM(total_amount), 0) AS revenue
          FROM orders
          WHERE store_id = ANY(${storeIds}::text[])
            AND created_at >= ${(0, merchant_dashboard_utils_1.daysAgo)(7)}
            AND ${(0, merchant_dashboard_utils_1.sqlOrderStatusNotIn)(merchant_dashboard_utils_1.CANCELLED_STATUSES)}
          GROUP BY 1
          ORDER BY 1
        `,
            ]);
            const countByStatus = (statuses) => statusCounts
                .filter((r) => statuses.includes(r.status))
                .reduce((sum, r) => sum + r._count.id, 0);
            const todayOrders = todayAgg._count.id;
            const todayRevenue = (0, merchant_dashboard_utils_1.decimalToNumber)(todayAgg._sum.totalAmount);
            const yesterdayOrders = yesterdayAgg._count.id;
            const yesterdayRevenue = (0, merchant_dashboard_utils_1.decimalToNumber)(yesterdayAgg._sum.totalAmount);
            const avgOrderValue = todayOrders > 0 ? Math.round((todayRevenue / todayOrders) * 100) / 100 : 0;
            const sparkline = sparklineRows.map((r) => ({
                date: r.day.toISOString().slice(0, 10),
                value: Number(r.orders),
            }));
            return {
                todayOrders,
                todayRevenue,
                pendingOrders: countByStatus([client_1.OrderStatus.PAID, client_1.OrderStatus.MERCHANT_ACCEPTED]),
                preparingOrders: countByStatus([client_1.OrderStatus.PREPARING]),
                packingOrders: countByStatus([client_1.OrderStatus.PACKING]),
                readyForPickup: countByStatus([client_1.OrderStatus.READY_FOR_PICKUP]),
                deliveredToday: countByStatus([client_1.OrderStatus.DELIVERED, client_1.OrderStatus.COMPLETED]),
                cancelledOrders: countByStatus(merchant_dashboard_utils_1.CANCELLED_STATUSES),
                avgOrderValue,
                customerRating: Math.round((storeRating._avg.ratingAvg ?? 0) * 10) / 10,
                ratingCount: storeRating._sum.ratingCount ?? 0,
                growth: {
                    ordersPct: (0, merchant_dashboard_utils_1.pctChange)(todayOrders, yesterdayOrders),
                    revenuePct: (0, merchant_dashboard_utils_1.pctChange)(todayRevenue, yesterdayRevenue),
                },
                sparkline,
            };
        }
        catch (error) {
            if (error instanceof common_1.ForbiddenException)
                throw error;
            this.logger.error(`getOverview failed (userId=${userId}, storeId=${query.storeId ?? 'all'})`, error instanceof Error ? error.stack : String(error));
            return { ...merchant_dashboard_utils_1.EMPTY_MERCHANT_OVERVIEW };
        }
    }
    async getOrders(userId, query) {
        try {
            const { storeIds } = await this.resolveStoreContext(userId, query.storeId);
            const page = query.page ?? 1;
            const limit = query.limit ?? 20;
            const skip = (page - 1) * limit;
            if (storeIds.length === 0) {
                return {
                    orders: [],
                    tabs: Object.fromEntries(Object.keys(merchant_dashboard_utils_1.ORDER_TAB_STATUSES).map((tab) => [tab, 0])),
                    meta: { page, limit, total: 0, totalPages: 0 },
                };
            }
            const where = {
                storeId: { in: storeIds },
                ...(query.tab
                    ? query.tab === 'ACTIVE'
                        ? (0, merchant_order_visibility_util_1.buildMerchantListWhere)({ merchantStatusGroup: 'active' })
                        : (0, merchant_order_visibility_util_1.buildMerchantListWhere)({ pipelineColumn: query.tab })
                    : (0, merchant_order_visibility_util_1.merchantDefaultVisibleWhere)()),
            };
            const tabWhere = (tab) => tab === 'ACTIVE'
                ? (0, merchant_order_visibility_util_1.buildMerchantListWhere)({ merchantStatusGroup: 'active' })
                : (0, merchant_order_visibility_util_1.buildMerchantListWhere)({ pipelineColumn: tab });
            const [orders, total, tabCountEntries] = await Promise.all([
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
                        buyerProfile: { select: { name: true, user: { select: { phone: true } } } },
                        items: { select: { id: true } },
                        delivery: {
                            select: {
                                status: true,
                                estimatedMins: true,
                                riderProfile: {
                                    select: {
                                        id: true,
                                        name: true,
                                        status: true,
                                        user: { select: { phone: true } },
                                    },
                                },
                            },
                        },
                    },
                }),
                this.prisma.order.count({ where }),
                Promise.all(Object.keys(merchant_dashboard_utils_1.ORDER_TAB_STATUSES).map(async (tab) => [
                    tab,
                    await this.prisma.order.count({
                        where: { storeId: { in: storeIds }, ...tabWhere(tab) },
                    }),
                ])),
            ]);
            const tabs = Object.fromEntries(tabCountEntries);
            return {
                orders: orders.map((o) => ({
                    id: o.id,
                    orderNumber: o.orderNumber,
                    customerName: o.buyerProfile?.name ?? 'Customer',
                    customerPhone: o.buyerProfile?.user?.phone ?? '',
                    itemsCount: o.items.length,
                    amount: (0, merchant_dashboard_utils_1.decimalToNumber)(o.totalAmount),
                    createdAt: o.createdAt.toISOString(),
                    status: o.status,
                    rider: o.delivery?.riderProfile
                        ? {
                            id: o.delivery.riderProfile.id,
                            name: o.delivery.riderProfile.name,
                            phone: o.delivery.riderProfile.user.phone,
                            status: o.delivery.riderProfile.status,
                        }
                        : null,
                    deliveryStatus: o.delivery?.status ?? null,
                    etaMinutes: o.delivery?.estimatedMins ?? null,
                })),
                tabs,
                meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
            };
        }
        catch (error) {
            if (error instanceof common_1.ForbiddenException)
                throw error;
            this.logger.error(`getOrders failed (userId=${userId})`, error instanceof Error ? error.stack : String(error));
            return {
                orders: [],
                tabs: Object.fromEntries(Object.keys(merchant_dashboard_utils_1.ORDER_TAB_STATUSES).map((tab) => [tab, 0])),
                meta: { page: query.page ?? 1, limit: query.limit ?? 20, total: 0, totalPages: 0 },
            };
        }
    }
    async getInventory(userId, query) {
        const empty = {
            summary: {
                totalProducts: 0,
                activeProducts: 0,
                outOfStock: 0,
                lowStock: 0,
                hiddenProducts: 0,
                draftProducts: 0,
            },
            lowStockProducts: [],
            topSelling: [],
        };
        try {
            const { storeIds } = await this.resolveStoreContext(userId, query.storeId);
            if (storeIds.length === 0)
                return empty;
            const [products, lowStock, topSellers] = await Promise.all([
                this.prisma.product.findMany({
                    where: { storeId: { in: storeIds }, deletedAt: null },
                    select: {
                        id: true,
                        name: true,
                        isActive: true,
                        variants: {
                            select: {
                                id: true,
                                isActive: true,
                                inventory: { select: { availableQty: true, lowStockThreshold: true, soldQty: true } },
                            },
                        },
                    },
                }),
                this.prisma.$queryRaw `
          SELECT p.id AS product_id, p.name AS product_name, v.id AS variant_id,
                 i.quantity, i.low_stock_threshold AS threshold
          FROM products p
          JOIN product_variants v ON v.product_id = p.id AND v.is_default = true
          JOIN inventory i ON i.variant_id = v.id
          WHERE p.store_id = ANY(${storeIds}::text[])
            AND p.deleted_at IS NULL
            AND i.quantity <= i.low_stock_threshold
          ORDER BY i.quantity ASC
          LIMIT 20
        `,
                this.prisma.orderItem.groupBy({
                    by: ['productId', 'productName'],
                    where: {
                        order: {
                            storeId: { in: storeIds },
                            status: { in: merchant_dashboard_utils_1.REVENUE_STATUSES },
                            createdAt: { gte: (0, merchant_dashboard_utils_1.daysAgo)(30) },
                        },
                    },
                    _sum: { quantity: true },
                    orderBy: { _sum: { quantity: 'desc' } },
                    take: 10,
                }),
            ]);
            let totalProducts = 0;
            let activeProducts = 0;
            let outOfStock = 0;
            let lowStockCount = 0;
            let hiddenProducts = 0;
            for (const p of products) {
                totalProducts += 1;
                const defaultVariant = p.variants.find((v) => v.isActive) ?? p.variants[0];
                const qty = defaultVariant?.inventory?.availableQty ?? 0;
                const threshold = defaultVariant?.inventory?.lowStockThreshold ?? 5;
                if (p.isActive && defaultVariant?.isActive !== false)
                    activeProducts += 1;
                else
                    hiddenProducts += 1;
                if (qty <= 0)
                    outOfStock += 1;
                else if (qty <= threshold)
                    lowStockCount += 1;
            }
            return {
                summary: {
                    totalProducts,
                    activeProducts,
                    outOfStock,
                    lowStock: lowStockCount,
                    hiddenProducts,
                    draftProducts: products.filter((p) => !p.isActive).length,
                },
                lowStockProducts: lowStock.map((r) => ({
                    productId: r.product_id,
                    productName: r.product_name,
                    variantId: r.variant_id,
                    quantity: r.quantity,
                    threshold: r.threshold,
                })),
                topSelling: topSellers.map((t) => ({
                    productId: t.productId,
                    productName: t.productName,
                    unitsSold: t._sum.quantity ?? 0,
                })),
            };
        }
        catch (error) {
            if (error instanceof common_1.ForbiddenException)
                throw error;
            this.logger.error(`getInventory failed (userId=${userId})`, error instanceof Error ? error.stack : String(error));
            return empty;
        }
    }
    async getRiders(userId, query) {
        const empty = { assignedRiders: 0, onlineRiders: 0, currentDeliveries: 0, riders: [] };
        try {
            const { storeIds } = await this.resolveStoreContext(userId, query.storeId);
            if (storeIds.length === 0)
                return empty;
            const activeDeliveries = await this.prisma.delivery.findMany({
                where: {
                    order: { storeId: { in: storeIds } },
                    status: {
                        in: [
                            client_1.DeliveryStatus.ASSIGNED,
                            client_1.DeliveryStatus.ACCEPTED,
                            client_1.DeliveryStatus.ARRIVED_AT_STORE,
                            client_1.DeliveryStatus.PICKED_UP,
                            client_1.DeliveryStatus.IN_TRANSIT,
                            client_1.DeliveryStatus.ARRIVED_AT_CUSTOMER,
                        ],
                    },
                },
                select: {
                    id: true,
                    status: true,
                    estimatedMins: true,
                    order: { select: { orderNumber: true, id: true } },
                    riderProfile: {
                        select: {
                            id: true,
                            name: true,
                            status: true,
                            user: { select: { phone: true } },
                            locations: {
                                orderBy: { recordedAt: 'desc' },
                                take: 1,
                                select: { latitude: true, longitude: true, recordedAt: true },
                            },
                        },
                    },
                },
            });
            const riders = activeDeliveries
                .filter((d) => d.riderProfile)
                .map((d) => {
                const loc = d.riderProfile.locations[0];
                return {
                    riderId: d.riderProfile.id,
                    name: d.riderProfile.name,
                    phone: d.riderProfile.user.phone,
                    status: d.riderProfile.status,
                    currentOrder: { id: d.order.id, orderNumber: d.order.orderNumber },
                    deliveryStatus: d.status,
                    etaMinutes: d.estimatedMins,
                    lastLocation: loc
                        ? {
                            lat: loc.latitude,
                            lng: loc.longitude,
                            recordedAt: loc.recordedAt.toISOString(),
                        }
                        : null,
                };
            });
            const onlineCount = riders.filter((r) => r.status === client_1.RiderStatus.ONLINE ||
                r.status === client_1.RiderStatus.ON_DELIVERY ||
                r.status === client_1.RiderStatus.BUSY).length;
            return {
                assignedRiders: riders.length,
                onlineRiders: onlineCount,
                currentDeliveries: activeDeliveries.length,
                riders,
            };
        }
        catch (error) {
            if (error instanceof common_1.ForbiddenException)
                throw error;
            this.logger.error(`getRiders failed (userId=${userId})`, error instanceof Error ? error.stack : String(error));
            return empty;
        }
    }
    async getAnalytics(userId, query) {
        const period = query.period ?? '7d';
        try {
            const { storeIds } = await this.resolveStoreContext(userId, query.storeId);
            if (storeIds.length === 0) {
                this.logger.debug(`Analytics: no stores for userId=${userId}, returning defaults`);
                return (0, merchant_dashboard_utils_1.emptyMerchantAnalytics)(period);
            }
            const days = period === '30d' ? 30 : 7;
            const since = (0, merchant_dashboard_utils_1.daysAgo)(days);
            const [dailyStats, categoryStats, hourlyStats] = await Promise.all([
                this.prisma.$queryRaw `
          SELECT date_trunc('day', created_at) AS day,
                 COUNT(*)::bigint AS orders,
                 COALESCE(SUM(total_amount), 0) AS revenue
          FROM orders
          WHERE store_id = ANY(${storeIds}::text[])
            AND created_at >= ${since}
            AND ${(0, merchant_dashboard_utils_1.sqlOrderStatusIn)(client_1.Prisma.sql `status`, merchant_dashboard_utils_1.REVENUE_STATUSES)}
          GROUP BY 1 ORDER BY 1
        `,
                this.prisma.$queryRaw `
          SELECT COALESCE(c.name, 'Uncategorized') AS category_name,
                 COALESCE(SUM(oi.total_price), 0) AS revenue,
                 COALESCE(SUM(oi.quantity), 0)::bigint AS units
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          JOIN products p ON p.id = oi.product_id
          LEFT JOIN categories c ON c.id = p.category_id
          WHERE o.store_id = ANY(${storeIds}::text[])
            AND o.created_at >= ${since}
            AND ${(0, merchant_dashboard_utils_1.sqlOrderStatusIn)(client_1.Prisma.sql `o.status`, merchant_dashboard_utils_1.REVENUE_STATUSES)}
          GROUP BY 1
          ORDER BY revenue DESC
          LIMIT 15
        `,
                this.prisma.$queryRaw `
          SELECT EXTRACT(HOUR FROM created_at)::int AS hour,
                 COUNT(*)::bigint AS orders
          FROM orders
          WHERE store_id = ANY(${storeIds}::text[])
            AND created_at >= ${since}
            AND ${(0, merchant_dashboard_utils_1.sqlOrderStatusNotIn)(merchant_dashboard_utils_1.CANCELLED_STATUSES)}
          GROUP BY 1 ORDER BY 1
        `,
            ]);
            const revenueSeries = dailyStats.map((r) => ({
                date: r.day.toISOString().slice(0, 10),
                revenue: (0, merchant_dashboard_utils_1.decimalToNumber)(r.revenue),
                orders: Number(r.orders),
            }));
            const itemPerformance = await this.prisma.orderItem.groupBy({
                by: ['productId', 'productName'],
                where: {
                    order: {
                        storeId: { in: storeIds },
                        createdAt: { gte: since },
                        status: { in: merchant_dashboard_utils_1.REVENUE_STATUSES },
                    },
                },
                _sum: { quantity: true, totalPrice: true },
            });
            const sorted = [...itemPerformance].sort((a, b) => (0, merchant_dashboard_utils_1.decimalToNumber)(b._sum.totalPrice) - (0, merchant_dashboard_utils_1.decimalToNumber)(a._sum.totalPrice));
            const todayStart = (0, merchant_dashboard_utils_1.startOfIstDay)();
            const weekStart = (0, merchant_dashboard_utils_1.daysAgo)(7);
            const monthStart = (0, merchant_dashboard_utils_1.daysAgo)(30);
            const [ordersToday, ordersThisWeek, ordersThisMonth, cancelledInPeriod, acceptedInPeriod, paidInPeriod] = await Promise.all([
                this.prisma.order.count({
                    where: { storeId: { in: storeIds }, createdAt: { gte: todayStart }, status: { notIn: merchant_dashboard_utils_1.CANCELLED_STATUSES } },
                }),
                this.prisma.order.count({
                    where: { storeId: { in: storeIds }, createdAt: { gte: weekStart }, status: { notIn: merchant_dashboard_utils_1.CANCELLED_STATUSES } },
                }),
                this.prisma.order.count({
                    where: { storeId: { in: storeIds }, createdAt: { gte: monthStart }, status: { notIn: merchant_dashboard_utils_1.CANCELLED_STATUSES } },
                }),
                this.prisma.order.count({
                    where: { storeId: { in: storeIds }, createdAt: { gte: since }, status: { in: merchant_dashboard_utils_1.CANCELLED_STATUSES } },
                }),
                this.prisma.order.count({
                    where: {
                        storeId: { in: storeIds },
                        createdAt: { gte: since },
                        status: { in: [client_1.OrderStatus.MERCHANT_ACCEPTED, client_1.OrderStatus.PREPARING, client_1.OrderStatus.PACKING, client_1.OrderStatus.READY_FOR_PICKUP, client_1.OrderStatus.RIDER_ASSIGNED, client_1.OrderStatus.PICKED_UP, client_1.OrderStatus.OUT_FOR_DELIVERY, client_1.OrderStatus.DELIVERED, client_1.OrderStatus.COMPLETED] },
                    },
                }),
                this.prisma.order.count({
                    where: { storeId: { in: storeIds }, createdAt: { gte: since }, status: client_1.OrderStatus.PAID },
                }),
            ]);
            const totalInPeriod = revenueSeries.reduce((s, r) => s + r.orders, 0);
            const cancellationRate = totalInPeriod > 0 ? Math.round((cancelledInPeriod / (totalInPeriod + cancelledInPeriod)) * 1000) / 10 : 0;
            const acceptanceDenom = paidInPeriod + acceptedInPeriod;
            const acceptanceRate = acceptanceDenom > 0 ? Math.round((acceptedInPeriod / acceptanceDenom) * 1000) / 10 : 100;
            return {
                period,
                ordersToday,
                ordersThisWeek,
                ordersThisMonth,
                avgPrepTimeMins: 0,
                cancellationRate,
                acceptanceRate,
                revenueSeries,
                categorySales: categoryStats.map((c) => ({
                    category: c.category_name,
                    revenue: (0, merchant_dashboard_utils_1.decimalToNumber)(c.revenue),
                    units: Number(c.units),
                })),
                hourlyDemand: hourlyStats.map((h) => ({
                    hour: h.hour,
                    orders: Number(h.orders),
                })),
                bestSellers: sorted.slice(0, 10).map((i) => ({
                    productId: i.productId,
                    productName: i.productName,
                    units: i._sum.quantity ?? 0,
                    revenue: (0, merchant_dashboard_utils_1.decimalToNumber)(i._sum.totalPrice),
                })),
                worstSellers: sorted
                    .filter((i) => (i._sum.quantity ?? 0) > 0)
                    .slice(-5)
                    .reverse()
                    .map((i) => ({
                    productId: i.productId,
                    productName: i.productName,
                    units: i._sum.quantity ?? 0,
                    revenue: (0, merchant_dashboard_utils_1.decimalToNumber)(i._sum.totalPrice),
                })),
            };
        }
        catch (error) {
            if (error instanceof common_1.ForbiddenException)
                throw error;
            this.logger.error(`getAnalytics failed (userId=${userId}, storeId=${query.storeId ?? 'all'}, period=${period})`, error instanceof Error ? error.stack : String(error));
            return (0, merchant_dashboard_utils_1.emptyMerchantAnalytics)(period);
        }
    }
    async getCustomers(userId, query) {
        const empty = {
            totalCustomers: 0,
            returningCustomers: 0,
            newCustomers: 0,
            repeatPurchasePct: 0,
            topCustomers: [],
            recentReviews: [],
            recentComplaints: [],
        };
        try {
            const { storeIds } = await this.resolveStoreContext(userId, query.storeId);
            if (storeIds.length === 0)
                return empty;
            const since30 = (0, merchant_dashboard_utils_1.daysAgo)(30);
            const orders = await this.prisma.order.findMany({
                where: {
                    storeId: { in: storeIds },
                    status: { in: merchant_dashboard_utils_1.REVENUE_STATUSES },
                    createdAt: { gte: since30 },
                },
                select: { buyerProfileId: true, createdAt: true },
            });
            if (orders.length === 0) {
                const recentReviews = await this.prisma.review.findMany({
                    where: { storeId: { in: storeIds } },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        rating: true,
                        comment: true,
                        createdAt: true,
                        user: { select: { buyerProfile: { select: { name: true } } } },
                    },
                });
                return {
                    ...empty,
                    recentReviews: recentReviews.map((r) => ({
                        id: r.id,
                        rating: r.rating,
                        comment: r.comment,
                        customerName: r.user.buyerProfile?.name ?? 'Customer',
                        createdAt: r.createdAt.toISOString(),
                    })),
                };
            }
            const buyerCounts = new Map();
            for (const o of orders) {
                buyerCounts.set(o.buyerProfileId, (buyerCounts.get(o.buyerProfileId) ?? 0) + 1);
            }
            const totalCustomers = buyerCounts.size;
            const returningCustomers = [...buyerCounts.values()].filter((c) => c > 1).length;
            const newCustomers = totalCustomers - returningCustomers;
            const repeatPurchasePct = totalCustomers > 0 ? Math.round((returningCustomers / totalCustomers) * 1000) / 10 : 0;
            const topBuyerIds = [...buyerCounts.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([id]) => id);
            const topBuyers = await this.prisma.buyerProfile.findMany({
                where: { id: { in: topBuyerIds } },
                select: { id: true, name: true, user: { select: { phone: true } } },
            });
            const recentReviews = await this.prisma.review.findMany({
                where: { storeId: { in: storeIds } },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    createdAt: true,
                    user: { select: { buyerProfile: { select: { name: true } } } },
                },
            });
            return {
                totalCustomers,
                returningCustomers,
                newCustomers,
                repeatPurchasePct,
                topCustomers: topBuyerIds.map((id) => {
                    const b = topBuyers.find((x) => x.id === id);
                    return {
                        id,
                        name: b?.name ?? 'Customer',
                        phone: b?.user.phone,
                        orderCount: buyerCounts.get(id) ?? 0,
                    };
                }),
                recentReviews: recentReviews.map((r) => ({
                    id: r.id,
                    rating: r.rating,
                    comment: r.comment,
                    customerName: r.user.buyerProfile?.name ?? 'Customer',
                    createdAt: r.createdAt.toISOString(),
                })),
                recentComplaints: [],
            };
        }
        catch (error) {
            if (error instanceof common_1.ForbiddenException)
                throw error;
            this.logger.error(`getCustomers failed (userId=${userId})`, error instanceof Error ? error.stack : String(error));
            return empty;
        }
    }
    async getCompliance(userId, query) {
        const empty = {
            stores: [],
            categoryRequests: { approved: 0, pending: 0, rejected: 0, documentsRequired: 0 },
            alerts: [],
        };
        try {
            const { storeIds } = await this.resolveStoreContext(userId, query.storeId);
            if (storeIds.length === 0)
                return empty;
            const stores = await this.prisma.store.findMany({
                where: { id: { in: storeIds } },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    submittedAt: true,
                    reviewedAt: true,
                    rejectionReason: true,
                    documentRequestReason: true,
                    documentRequestAt: true,
                    verificationDocuments: {
                        select: { documentType: true, uploadedAt: true },
                    },
                    merchantProfile: {
                        select: { kycStatus: true, gstNumber: true },
                    },
                },
            });
            const categoryRequests = await this.prisma.storeCategoryRequest.groupBy({
                by: ['status'],
                where: { storeId: { in: storeIds } },
                _count: { id: true },
            });
            const docTypes = new Set(stores.flatMap((s) => s.verificationDocuments.map((d) => d.documentType)));
            return {
                stores: stores.map((s) => ({
                    id: s.id,
                    name: s.name,
                    approvalStatus: s.status,
                    kycStatus: s.merchantProfile.kycStatus,
                    gstProvided: Boolean(s.merchantProfile.gstNumber),
                    fssaiProvided: docTypes.has(client_1.StoreDocumentType.FSSAI_LICENSE),
                    documents: s.verificationDocuments.map((d) => ({
                        type: d.documentType,
                        uploadedAt: d.uploadedAt.toISOString(),
                    })),
                    timeline: [
                        s.submittedAt && { event: 'Submitted', at: s.submittedAt.toISOString() },
                        s.documentRequestAt && {
                            event: 'Documents requested',
                            at: s.documentRequestAt.toISOString(),
                            note: s.documentRequestReason,
                        },
                        s.reviewedAt && { event: 'Reviewed', at: s.reviewedAt.toISOString() },
                    ].filter(Boolean),
                })),
                categoryRequests: {
                    approved: categoryRequests.find((c) => c.status === client_1.StoreCategoryRequestStatus.APPROVED)?._count.id ?? 0,
                    pending: categoryRequests.find((c) => c.status === client_1.StoreCategoryRequestStatus.PENDING)?._count.id ?? 0,
                    underReview: categoryRequests.find((c) => c.status === client_1.StoreCategoryRequestStatus.UNDER_REVIEW)?._count.id ?? 0,
                    rejected: categoryRequests.find((c) => c.status === client_1.StoreCategoryRequestStatus.REJECTED)?._count.id ?? 0,
                    documentsRequired: categoryRequests.find((c) => c.status === client_1.StoreCategoryRequestStatus.DOCUMENTS_REQUIRED)?._count.id ?? 0,
                },
                alerts: stores
                    .filter((s) => [
                    client_1.StoreStatus.DOCUMENTS_REQUIRED,
                    client_1.StoreStatus.REJECTED,
                    client_1.StoreStatus.PENDING_REVIEW,
                ].includes(s.status))
                    .map((s) => ({
                    storeId: s.id,
                    storeName: s.name,
                    status: s.status,
                    message: s.rejectionReason ?? s.documentRequestReason ?? 'Action required',
                })),
            };
        }
        catch (error) {
            if (error instanceof common_1.ForbiddenException)
                throw error;
            this.logger.error(`getCompliance failed (userId=${userId})`, error instanceof Error ? error.stack : String(error));
            return empty;
        }
    }
    async getNotifications(userId, query) {
        const empty = {
            recentOrders: [],
            newReviews: [],
            inventoryAlerts: 0,
            complianceAlerts: [],
            categoryRequests: 0,
        };
        try {
            const { storeIds } = await this.resolveStoreContext(userId, query.storeId);
            if (storeIds.length === 0)
                return empty;
            const [recentOrders, inventory, compliance] = await Promise.all([
                this.prisma.order.findMany({
                    where: { storeId: { in: storeIds } },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: { id: true, orderNumber: true, status: true, createdAt: true },
                }),
                this.getInventory(userId, query),
                this.getCompliance(userId, query),
            ]);
            const recentReviews = await this.prisma.review.findMany({
                where: { storeId: { in: storeIds } },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, rating: true, createdAt: true },
            });
            return {
                recentOrders: recentOrders.map((o) => ({
                    id: o.id,
                    orderNumber: o.orderNumber,
                    status: o.status,
                    createdAt: o.createdAt.toISOString(),
                })),
                newReviews: recentReviews.map((r) => ({
                    id: r.id,
                    rating: r.rating,
                    createdAt: r.createdAt.toISOString(),
                })),
                inventoryAlerts: inventory.summary.lowStock,
                complianceAlerts: compliance.alerts,
                categoryRequests: compliance.categoryRequests.pending,
            };
        }
        catch (error) {
            if (error instanceof common_1.ForbiddenException)
                throw error;
            this.logger.error(`getNotifications failed (userId=${userId})`, error instanceof Error ? error.stack : String(error));
            return empty;
        }
    }
};
exports.MerchantDashboardService = MerchantDashboardService;
exports.MerchantDashboardService = MerchantDashboardService = MerchantDashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MerchantDashboardService);
//# sourceMappingURL=merchant-dashboard.service.js.map