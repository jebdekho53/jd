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
var AnalyticsAggregatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsAggregatorService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const merchant_dashboard_utils_1 = require("../merchant-dashboard/merchant-dashboard.utils");
const ist_day_util_1 = require("../../common/utils/ist-day.util");
const order_status_sql_util_1 = require("../../common/utils/order-status-sql.util");
function dayRange(date) {
    return (0, ist_day_util_1.istDayRange)(date);
}
function hourRange(date) {
    return (0, ist_day_util_1.istHourRange)(date);
}
let AnalyticsAggregatorService = AnalyticsAggregatorService_1 = class AnalyticsAggregatorService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AnalyticsAggregatorService_1.name);
    }
    async aggregateHourly(bucketAt, storeId) {
        const { start, end } = hourRange(bucketAt);
        const storeFilter = storeId ? { storeId } : {};
        const [orders, agg] = await Promise.all([
            this.prisma.order.count({ where: { createdAt: { gte: start, lt: end }, ...storeFilter } }),
            this.prisma.order.aggregate({
                where: {
                    createdAt: { gte: start, lt: end },
                    status: { in: merchant_dashboard_utils_1.REVENUE_STATUSES },
                    ...storeFilter,
                },
                _sum: { totalAmount: true },
            }),
        ]);
        const gmv = (0, merchant_dashboard_utils_1.decimalToNumber)(agg._sum.totalAmount);
        return { orders, gmv, revenue: gmv };
    }
    async aggregatePlatformDaily(date, prevDate) {
        const { start, end } = dayRange(date);
        const prev = prevDate ?? new Date(start.getTime() - 86_400_000);
        const prevRange = dayRange(prev);
        const [executive, orders, customers, riders, geo, inventory, walletRewards, funnel, prevGmv, prevOrders,] = await Promise.all([
            this.buildExecutive(start, end),
            this.buildOrderAnalytics(start, end),
            this.buildCustomerAnalytics(start, end),
            this.buildRiderAnalytics(start, end),
            this.buildGeoAnalytics(start, end),
            this.buildInventoryAnalytics(),
            this.buildWalletRewards(start, end),
            this.buildFunnel(start, end),
            this.prisma.order.aggregate({
                where: { createdAt: { gte: prevRange.start, lt: prevRange.end }, status: { in: merchant_dashboard_utils_1.REVENUE_STATUSES } },
                _sum: { totalAmount: true },
            }),
            this.prisma.order.count({ where: { createdAt: { gte: prevRange.start, lt: prevRange.end } } }),
        ]);
        const prevRevenue = (0, merchant_dashboard_utils_1.decimalToNumber)(prevGmv._sum.totalAmount);
        executive.growthPct = {
            gmv: (0, merchant_dashboard_utils_1.pctChange)(executive.gmv, prevRevenue),
            orders: (0, merchant_dashboard_utils_1.pctChange)(executive.orders, prevOrders),
            revenue: (0, merchant_dashboard_utils_1.pctChange)(executive.revenue, prevRevenue),
        };
        return { executive, orders, customers, riders, geo, inventory, walletRewards, funnel };
    }
    async aggregateStoreDaily(storeId, date) {
        const { start, end } = dayRange(date);
        const [revenueAgg, orderCount, items, categories, repeatBuyers, walletUsage, reviews] = await Promise.all([
            this.prisma.order.aggregate({
                where: { storeId, createdAt: { gte: start, lt: end }, status: { in: merchant_dashboard_utils_1.REVENUE_STATUSES } },
                _sum: { totalAmount: true, walletAmountUsed: true, rewardPointsUsed: true },
            }),
            this.prisma.order.count({
                where: { storeId, createdAt: { gte: start, lt: end }, status: { notIn: merchant_dashboard_utils_1.CANCELLED_STATUSES } },
            }),
            this.prisma.orderItem.groupBy({
                by: ['productId', 'productName'],
                where: {
                    order: { storeId, createdAt: { gte: start, lt: end }, status: { in: merchant_dashboard_utils_1.REVENUE_STATUSES } },
                },
                _sum: { quantity: true, totalPrice: true },
            }),
            this.prisma.$queryRaw `
          SELECT COALESCE(c.name, 'Uncategorized') AS category_name,
                 COALESCE(SUM(oi.total_price), 0) AS revenue,
                 COALESCE(SUM(oi.quantity), 0)::bigint AS units
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          JOIN products p ON p.id = oi.product_id
          LEFT JOIN categories c ON c.id = p.category_id
          WHERE o.store_id = ${storeId}
            AND o.created_at >= ${start} AND o.created_at < ${end}
            AND ${(0, order_status_sql_util_1.sqlOrderStatusIn)(client_1.Prisma.sql `o.status`, merchant_dashboard_utils_1.REVENUE_STATUSES)}
          GROUP BY 1 ORDER BY revenue DESC LIMIT 10
        `,
            this.prisma.$queryRaw `
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
        const revenue = (0, merchant_dashboard_utils_1.decimalToNumber)(revenueAgg._sum.totalAmount);
        const sortedItems = [...items].sort((a, b) => (0, merchant_dashboard_utils_1.decimalToNumber)(b._sum.totalPrice) - (0, merchant_dashboard_utils_1.decimalToNumber)(a._sum.totalPrice));
        const productsSold = sortedItems.reduce((s, i) => s + (i._sum.quantity ?? 0), 0);
        const uniqueBuyers = await this.prisma.order.groupBy({
            by: ['buyerProfileId'],
            where: { storeId, createdAt: { gte: start, lt: end }, status: { in: merchant_dashboard_utils_1.REVENUE_STATUSES } },
        });
        const ratingByDay = new Map();
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
                revenue: (0, merchant_dashboard_utils_1.decimalToNumber)(c.revenue),
                units: Number(c.units),
            })),
            topProducts: sortedItems.slice(0, 10).map((i) => ({
                productId: i.productId,
                name: i.productName,
                units: i._sum.quantity ?? 0,
                revenue: (0, merchant_dashboard_utils_1.decimalToNumber)(i._sum.totalPrice),
            })),
            repeatCustomers: Number(repeatBuyers[0]?.cnt ?? 0),
            customerLtv: uniqueBuyers.length > 0 ? Math.round((revenue / uniqueBuyers.length) * 100) / 100 : 0,
            walletUsage: (0, merchant_dashboard_utils_1.decimalToNumber)(walletUsage._sum.walletAmountUsed),
            rewardRedemption: revenueAgg._sum.rewardPointsUsed ?? 0,
            storeRatingTrend: [...ratingByDay.entries()].map(([date, v]) => ({
                date,
                rating: Math.round((v.sum / v.count) * 10) / 10,
                count: v.count,
            })),
        };
    }
    async buildExecutive(start, end) {
        const [gmvAgg, orderCount, activeBuyers, activeMerchants, activeRiders, completed, checkouts, refunded, walletAgg, pointsAgg,] = await Promise.all([
            this.prisma.order.aggregate({
                where: { createdAt: { gte: start, lt: end }, status: { in: merchant_dashboard_utils_1.REVENUE_STATUSES } },
                _sum: { totalAmount: true },
            }),
            this.prisma.order.count({ where: { createdAt: { gte: start, lt: end } } }),
            this.prisma.order.groupBy({
                by: ['buyerProfileId'],
                where: { createdAt: { gte: start, lt: end } },
            }),
            this.prisma.order.groupBy({
                by: ['storeId'],
                where: { createdAt: { gte: start, lt: end }, status: { in: merchant_dashboard_utils_1.REVENUE_STATUSES } },
            }),
            this.prisma.delivery.groupBy({
                by: ['riderProfileId'],
                where: { assignedAt: { gte: start, lt: end }, riderProfileId: { not: null } },
            }),
            this.prisma.order.count({
                where: { createdAt: { gte: start, lt: end }, status: { in: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.COMPLETED] } },
            }),
            this.prisma.checkout.count({ where: { createdAt: { gte: start, lt: end } } }),
            this.prisma.order.count({
                where: { createdAt: { gte: start, lt: end }, status: client_1.OrderStatus.REFUNDED },
            }),
            this.prisma.buyerWallet.aggregate({ _sum: { balance: true } }),
            this.prisma.buyerWallet.aggregate({ _sum: { rewardPoints: true } }),
        ]);
        const gmv = (0, merchant_dashboard_utils_1.decimalToNumber)(gmvAgg._sum.totalAmount);
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
            walletLiability: (0, merchant_dashboard_utils_1.decimalToNumber)(walletAgg._sum.balance),
            rewardLiability: pointsAgg._sum.rewardPoints ?? 0,
            growthPct: { gmv: 0, orders: 0, revenue: 0 },
        };
    }
    async buildOrderAnalytics(start, end) {
        const where = { createdAt: { gte: start, lt: end } };
        const [created, completed, cancelled, returned, payments, deliveries, prepTimes] = await Promise.all([
            this.prisma.order.count({ where }),
            this.prisma.order.count({
                where: { ...where, status: { in: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.COMPLETED] } },
            }),
            this.prisma.order.count({ where: { ...where, status: { in: merchant_dashboard_utils_1.CANCELLED_STATUSES } } }),
            this.prisma.order.count({ where: { ...where, status: client_1.OrderStatus.REFUNDED } }),
            this.prisma.order.groupBy({
                by: ['paymentMethod'],
                where: { ...where, status: { in: merchant_dashboard_utils_1.REVENUE_STATUSES } },
                _count: { id: true },
            }),
            this.prisma.delivery.findMany({
                where: {
                    deliveredAt: { gte: start, lt: end },
                    status: client_1.DeliveryStatus.DELIVERED,
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
        const countMethod = (m) => payments.find((p) => p.paymentMethod === m)?._count.id ?? 0;
        const pct = (n) => (totalPaid > 0 ? Math.round((n / totalPaid) * 1000) / 10 : 0);
        const deliveryDurations = deliveries
            .filter((d) => d.assignedAt && d.deliveredAt)
            .map((d) => (d.deliveredAt.getTime() - d.assignedAt.getTime()) / 60_000);
        const prepDurations = prepTimes
            .filter((o) => o.paidAt && o.delivery?.pickedUpAt)
            .map((o) => (o.delivery.pickedUpAt.getTime() - o.paidAt.getTime()) / 60_000);
        const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
        const cod = countMethod(client_1.PaymentMethod.COD) + countMethod(client_1.PaymentMethod.WALLET_COD);
        const wallet = countMethod(client_1.PaymentMethod.WALLET) +
            countMethod(client_1.PaymentMethod.WALLET_COD) +
            countMethod(client_1.PaymentMethod.WALLET_RAZORPAY);
        const razorpay = countMethod(client_1.PaymentMethod.RAZORPAY) + countMethod(client_1.PaymentMethod.WALLET_RAZORPAY);
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
    async buildCustomerAnalytics(start, end) {
        const [newBuyers, orderBuyers, walletUsers, tiers, referrals, topSpend] = await Promise.all([
            this.prisma.buyerProfile.count({ where: { createdAt: { gte: start, lt: end } } }),
            this.prisma.order.groupBy({
                by: ['buyerProfileId'],
                where: { createdAt: { gte: start, lt: end }, status: { in: merchant_dashboard_utils_1.REVENUE_STATUSES } },
                _count: { id: true },
                _sum: { totalAmount: true },
            }),
            this.prisma.buyerWallet.count({ where: { balance: { gt: 0 } } }),
            this.prisma.buyerWallet.groupBy({ by: ['tier'], _count: { id: true } }),
            this.prisma.referral.groupBy({ by: ['status'], _count: { id: true } }),
            this.prisma.order.groupBy({
                by: ['buyerProfileId'],
                where: { createdAt: { gte: start, lt: end }, status: { in: merchant_dashboard_utils_1.REVENUE_STATUSES } },
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
            where: { createdAt: { lt: start }, status: { in: merchant_dashboard_utils_1.REVENUE_STATUSES } },
        });
        const priorSet = new Set(priorBuyers.map((b) => b.buyerProfileId));
        const returningCustomers = orderBuyers.filter((b) => priorSet.has(b.buyerProfileId)).length;
        const retentionPct = priorSet.size > 0 ? Math.round((returningCustomers / priorSet.size) * 1000) / 10 : 0;
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
                spend: (0, merchant_dashboard_utils_1.decimalToNumber)(t._sum.totalAmount),
            })),
            walletUsers,
            tierDistribution: tiers.map((t) => ({ tier: t.tier, count: t._count.id })),
            referralPerformance: {
                completed: referrals.find((r) => r.status === 'COMPLETED')?._count.id ?? 0,
                pending: referrals.find((r) => r.status === 'PENDING')?._count.id ?? 0,
            },
        };
    }
    async buildRiderAnalytics(start, end) {
        const deliveries = await this.prisma.delivery.findMany({
            where: {
                deliveredAt: { gte: start, lt: end },
                status: client_1.DeliveryStatus.DELIVERED,
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
            .map((d) => (d.deliveredAt.getTime() - d.assignedAt.getTime()) / 60_000);
        const avgDeliveryMins = durations.length
            ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
            : 0;
        const [assignments, rejections] = await Promise.all([
            this.prisma.deliveryAssignment.count({ where: { offeredAt: { gte: start, lt: end } } }),
            this.prisma.deliveryAssignment.count({
                where: { offeredAt: { gte: start, lt: end }, status: 'REJECTED' },
            }),
        ]);
        const acceptanceRate = assignments > 0 ? Math.round(((assignments - rejections) / assignments) * 1000) / 10 : 100;
        const rejectionRate = assignments > 0 ? Math.round((rejections / assignments) * 1000) / 10 : 0;
        const riderMap = new Map();
        for (const d of deliveries) {
            if (!d.riderProfileId)
                continue;
            const cur = riderMap.get(d.riderProfileId) ?? {
                deliveries: 0,
                late: 0,
                name: d.riderProfile?.name ?? 'Rider',
            };
            cur.deliveries += 1;
            if (d.estimatedMins && d.assignedAt && d.deliveredAt) {
                const actual = (d.deliveredAt.getTime() - d.assignedAt.getTime()) / 60_000;
                if (actual > d.estimatedMins + 10)
                    cur.late += 1;
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
            distanceCoveredKm: Math.round(deliveries.reduce((s, d) => s + (d.distanceKm ?? 0), 0) * 10) / 10,
            revenueGenerated: Math.round(deliveries.reduce((s, d) => s + (0, merchant_dashboard_utils_1.decimalToNumber)(d.order?.totalAmount), 0) * 100) / 100,
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
    async buildGeoAnalytics(start, end) {
        const orders = await this.prisma.order.findMany({
            where: {
                createdAt: { gte: start, lt: end },
                status: { in: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.COMPLETED] },
            },
            select: {
                deliveryLat: true,
                deliveryLng: true,
                totalAmount: true,
                store: { select: { city: { select: { name: true } }, locality: true, line2: true } },
            },
            take: 3000,
        });
        const cityMap = new Map();
        const areaMap = new Map();
        const localityMap = new Map();
        const grid = new Map();
        const heatmap = [];
        for (const o of orders) {
            const amt = (0, merchant_dashboard_utils_1.decimalToNumber)(o.totalAmount);
            const city = o.store.city?.name ?? 'Unknown';
            const area = o.store.line2 ?? o.store.locality ?? 'Unknown';
            const locality = o.store.locality ?? 'Unknown';
            for (const [map, key] of [
                [cityMap, city],
                [areaMap, area],
                [localityMap, locality],
            ]) {
                const cur = map.get(key) ?? { count: 0, revenue: 0 };
                map.set(key, { count: cur.count + 1, revenue: cur.revenue + amt });
            }
            const gk = `${o.deliveryLat.toFixed(2)},${o.deliveryLng.toFixed(2)}`;
            grid.set(gk, (grid.get(gk) ?? 0) + 1);
            heatmap.push({ lat: o.deliveryLat, lng: o.deliveryLng, weight: 1 });
        }
        const top = (m) => [...m.entries()]
            .map(([name, v]) => ({ name, ...v }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        const [storeCount, riderCount] = await Promise.all([
            this.prisma.store.count({ where: { status: client_1.StoreStatus.APPROVED, deletedAt: null } }),
            this.prisma.riderProfile.count({
                where: { status: { in: [client_1.RiderStatus.ONLINE, client_1.RiderStatus.BUSY, client_1.RiderStatus.ON_DELIVERY] } },
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
    async buildInventoryAnalytics() {
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
    async buildWalletRewards(start, end) {
        const [credits, debits, walletAgg, pointsAgg, referrals, tierEvents, expired] = await Promise.all([
            this.prisma.walletTransaction.aggregate({
                where: {
                    createdAt: { gte: start, lt: end },
                    type: { in: [client_1.WalletTransactionType.CREDIT, client_1.WalletTransactionType.REFUND, client_1.WalletTransactionType.ADMIN_ADJUSTMENT] },
                    amount: { gt: 0 },
                },
                _sum: { amount: true },
            }),
            this.prisma.walletTransaction.aggregate({
                where: {
                    createdAt: { gte: start, lt: end },
                    type: client_1.WalletTransactionType.DEBIT,
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
            walletCredits: (0, merchant_dashboard_utils_1.decimalToNumber)(credits._sum.amount),
            walletDebits: (0, merchant_dashboard_utils_1.decimalToNumber)(debits._sum.amount),
            outstandingLiability: (0, merchant_dashboard_utils_1.decimalToNumber)(walletAgg._sum.balance),
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
    async buildFunnel(start, end) {
        const [carts, checkouts, ordersCreated, ordersCompleted] = await Promise.all([
            this.prisma.cart.count({ where: { updatedAt: { gte: start, lt: end } } }),
            this.prisma.checkout.count({ where: { createdAt: { gte: start, lt: end } } }),
            this.prisma.order.count({ where: { createdAt: { gte: start, lt: end } } }),
            this.prisma.order.count({
                where: {
                    createdAt: { gte: start, lt: end },
                    status: { in: [client_1.OrderStatus.DELIVERED, client_1.OrderStatus.COMPLETED] },
                },
            }),
        ]);
        const cartItems = await this.prisma.cartItem.count({
            where: { createdAt: { gte: start, lt: end } },
        });
        const steps = {
            visitors: Math.max(carts * 2, checkouts),
            searches: Math.round(carts * 1.5),
            storeViews: carts,
            productViews: cartItems,
            addToCart: cartItems,
            checkoutStarted: checkouts,
            orderCreated: ordersCreated,
            orderCompleted: ordersCompleted,
        };
        const dropOffPct = {};
        const keys = Object.keys(steps);
        for (let i = 1; i < keys.length; i++) {
            const prev = steps[keys[i - 1]];
            const cur = steps[keys[i]];
            dropOffPct[`${keys[i - 1]}_to_${keys[i]}`] =
                prev > 0 ? Math.round(((prev - cur) / prev) * 1000) / 10 : 0;
        }
        return { ...steps, dropOffPct };
    }
};
exports.AnalyticsAggregatorService = AnalyticsAggregatorService;
exports.AnalyticsAggregatorService = AnalyticsAggregatorService = AnalyticsAggregatorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsAggregatorService);
//# sourceMappingURL=analytics-aggregator.service.js.map