import { OrderStatus } from '@prisma/client';
export declare const CANCELLED_STATUSES: OrderStatus[];
export declare const REVENUE_STATUSES: OrderStatus[];
export declare const ORDER_TAB_STATUSES: Record<string, OrderStatus[]>;
export declare const EMPTY_MERCHANT_OVERVIEW: {
    todayOrders: number;
    todayRevenue: number;
    pendingOrders: number;
    preparingOrders: number;
    packingOrders: number;
    readyForPickup: number;
    deliveredToday: number;
    cancelledOrders: number;
    avgOrderValue: number;
    customerRating: number;
    ratingCount: number;
    growth: {
        ordersPct: number;
        revenuePct: number;
    };
    sparkline: {
        date: string;
        value: number;
    }[];
};
export declare function emptyMerchantAnalytics(period?: '7d' | '30d'): {
    period: "30d" | "7d";
    ordersToday: number;
    ordersThisWeek: number;
    ordersThisMonth: number;
    avgPrepTimeMins: number;
    cancellationRate: number;
    acceptanceRate: number;
    revenueSeries: {
        date: string;
        revenue: number;
        orders: number;
    }[];
    categorySales: {
        category: string;
        revenue: number;
        units: number;
    }[];
    hourlyDemand: {
        hour: number;
        orders: number;
    }[];
    bestSellers: {
        productId: string;
        productName: string;
        units: number;
        revenue: number;
    }[];
    worstSellers: {
        productId: string;
        productName: string;
        units: number;
        revenue: number;
    }[];
};
export { sqlOrderStatusIn, sqlOrderStatusNotIn } from '../../common/utils/order-status-sql.util';
export { daysAgo, daysAgoIst, endOfIstDay, istDayRange, istHourRange, istWeekdayIndex, merchantOrderDayFilter, orderIstDayFilter, startOfIstDay, startOfIstMonth, startOfIstWeek, startOfUtcDay, } from '../../common/utils/ist-day.util';
export declare function decimalToNumber(value: {
    toNumber(): number;
} | number | null | undefined): number;
export declare function pctChange(current: number, previous: number): number;
