import { OrderStatus } from '@prisma/client';

export const CANCELLED_STATUSES: OrderStatus[] = [
  OrderStatus.CANCELLED_BY_BUYER,
  OrderStatus.CANCELLED_BY_MERCHANT,
  OrderStatus.CANCELLED_BY_ADMIN,
];

export const REVENUE_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.MERCHANT_ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.PACKING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.RIDER_ASSIGNED,
  OrderStatus.PICKED_UP,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
];

export const ORDER_TAB_STATUSES: Record<string, OrderStatus[]> = {
  NEW: [OrderStatus.PAID, OrderStatus.CREATED, OrderStatus.PAYMENT_PENDING],
  ACCEPTED: [OrderStatus.MERCHANT_ACCEPTED],
  PREPARING: [OrderStatus.PREPARING],
  PACKING: [OrderStatus.PACKING],
  READY_FOR_PICKUP: [OrderStatus.READY_FOR_PICKUP],
  RIDER_ASSIGNED: [OrderStatus.RIDER_ASSIGNED, OrderStatus.PICKED_UP],
  OUT_FOR_DELIVERY: [OrderStatus.OUT_FOR_DELIVERY],
  CANCELLED: CANCELLED_STATUSES,
};

export const EMPTY_MERCHANT_OVERVIEW = {
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
  sparkline: [] as { date: string; value: number }[],
};

export function emptyMerchantAnalytics(period: '7d' | '30d' = '7d') {
  return {
    period,
    ordersToday: 0,
    ordersThisWeek: 0,
    ordersThisMonth: 0,
    avgPrepTimeMins: 0,
    cancellationRate: 0,
    acceptanceRate: 0,
    revenueSeries: [] as { date: string; revenue: number; orders: number }[],
    categorySales: [] as { category: string; revenue: number; units: number }[],
    hourlyDemand: [] as { hour: number; orders: number }[],
    bestSellers: [] as { productId: string; productName: string; units: number; revenue: number }[],
    worstSellers: [] as { productId: string; productName: string; units: number; revenue: number }[],
  };
}

export { sqlOrderStatusIn, sqlOrderStatusNotIn } from '../../common/utils/order-status-sql.util';

export function startOfUtcDay(date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function daysAgo(n: number): Date {
  const d = startOfUtcDay();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

export function decimalToNumber(value: { toNumber(): number } | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === 'number' ? value : value.toNumber();
}

export function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
