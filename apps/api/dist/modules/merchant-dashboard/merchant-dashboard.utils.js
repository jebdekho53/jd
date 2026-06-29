"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startOfUtcDay = exports.startOfIstWeek = exports.startOfIstMonth = exports.startOfIstDay = exports.orderIstDayFilter = exports.merchantOrderDayFilter = exports.istWeekdayIndex = exports.istHourRange = exports.istDayRange = exports.endOfIstDay = exports.daysAgoIst = exports.daysAgo = exports.sqlOrderStatusNotIn = exports.sqlOrderStatusIn = exports.EMPTY_MERCHANT_OVERVIEW = exports.ORDER_TAB_STATUSES = exports.REVENUE_STATUSES = exports.CANCELLED_STATUSES = void 0;
exports.emptyMerchantAnalytics = emptyMerchantAnalytics;
exports.decimalToNumber = decimalToNumber;
exports.pctChange = pctChange;
const client_1 = require("@prisma/client");
exports.CANCELLED_STATUSES = [
    client_1.OrderStatus.CANCELLED_BY_BUYER,
    client_1.OrderStatus.CANCELLED_BY_MERCHANT,
    client_1.OrderStatus.CANCELLED_BY_ADMIN,
];
exports.REVENUE_STATUSES = [
    client_1.OrderStatus.PAID,
    client_1.OrderStatus.MERCHANT_ACCEPTED,
    client_1.OrderStatus.PREPARING,
    client_1.OrderStatus.PACKING,
    client_1.OrderStatus.READY_FOR_PICKUP,
    client_1.OrderStatus.RIDER_ASSIGNED,
    client_1.OrderStatus.PICKED_UP,
    client_1.OrderStatus.OUT_FOR_DELIVERY,
    client_1.OrderStatus.DELIVERED,
    client_1.OrderStatus.COMPLETED,
];
exports.ORDER_TAB_STATUSES = {
    NEW: [client_1.OrderStatus.PAID, client_1.OrderStatus.MERCHANT_ACCEPTED],
    ACCEPTED: [client_1.OrderStatus.MERCHANT_ACCEPTED],
    PREPARING: [client_1.OrderStatus.PREPARING],
    PACKING: [client_1.OrderStatus.PACKING],
    READY_FOR_PICKUP: [client_1.OrderStatus.READY_FOR_PICKUP],
    RIDER_ASSIGNED: [client_1.OrderStatus.RIDER_ASSIGNED, client_1.OrderStatus.PICKED_UP],
    OUT_FOR_DELIVERY: [client_1.OrderStatus.OUT_FOR_DELIVERY],
    CANCELLED: exports.CANCELLED_STATUSES,
};
exports.EMPTY_MERCHANT_OVERVIEW = {
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    packingOrders: 0,
    readyForPickup: 0,
    deliveredToday: 0,
    cancelledOrders: 0,
    avgOrderValue: 0,
    customerRating: 0,
    ratingCount: 0,
    growth: { ordersPct: 0, revenuePct: 0 },
    sparkline: [],
};
function emptyMerchantAnalytics(period = '7d') {
    return {
        period,
        ordersToday: 0,
        ordersThisWeek: 0,
        ordersThisMonth: 0,
        avgPrepTimeMins: 0,
        cancellationRate: 0,
        acceptanceRate: 0,
        revenueSeries: [],
        categorySales: [],
        hourlyDemand: [],
        bestSellers: [],
        worstSellers: [],
    };
}
var order_status_sql_util_1 = require("../../common/utils/order-status-sql.util");
Object.defineProperty(exports, "sqlOrderStatusIn", { enumerable: true, get: function () { return order_status_sql_util_1.sqlOrderStatusIn; } });
Object.defineProperty(exports, "sqlOrderStatusNotIn", { enumerable: true, get: function () { return order_status_sql_util_1.sqlOrderStatusNotIn; } });
var ist_day_util_1 = require("../../common/utils/ist-day.util");
Object.defineProperty(exports, "daysAgo", { enumerable: true, get: function () { return ist_day_util_1.daysAgo; } });
Object.defineProperty(exports, "daysAgoIst", { enumerable: true, get: function () { return ist_day_util_1.daysAgoIst; } });
Object.defineProperty(exports, "endOfIstDay", { enumerable: true, get: function () { return ist_day_util_1.endOfIstDay; } });
Object.defineProperty(exports, "istDayRange", { enumerable: true, get: function () { return ist_day_util_1.istDayRange; } });
Object.defineProperty(exports, "istHourRange", { enumerable: true, get: function () { return ist_day_util_1.istHourRange; } });
Object.defineProperty(exports, "istWeekdayIndex", { enumerable: true, get: function () { return ist_day_util_1.istWeekdayIndex; } });
Object.defineProperty(exports, "merchantOrderDayFilter", { enumerable: true, get: function () { return ist_day_util_1.merchantOrderDayFilter; } });
Object.defineProperty(exports, "orderIstDayFilter", { enumerable: true, get: function () { return ist_day_util_1.orderIstDayFilter; } });
Object.defineProperty(exports, "startOfIstDay", { enumerable: true, get: function () { return ist_day_util_1.startOfIstDay; } });
Object.defineProperty(exports, "startOfIstMonth", { enumerable: true, get: function () { return ist_day_util_1.startOfIstMonth; } });
Object.defineProperty(exports, "startOfIstWeek", { enumerable: true, get: function () { return ist_day_util_1.startOfIstWeek; } });
Object.defineProperty(exports, "startOfUtcDay", { enumerable: true, get: function () { return ist_day_util_1.startOfUtcDay; } });
function decimalToNumber(value) {
    if (value == null)
        return 0;
    return typeof value === 'number' ? value : value.toNumber();
}
function pctChange(current, previous) {
    if (previous === 0)
        return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
}
//# sourceMappingURL=merchant-dashboard.utils.js.map