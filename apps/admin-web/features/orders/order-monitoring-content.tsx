'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAdminOrdersQuery } from '@/hooks/use-orders';
import { useAdminFleetRealtime } from '@/features/realtime/use-admin-fleet-realtime';
import type { ListOrdersParams, OrderStatus, PaymentMethod, PaymentStatus } from '@/types/order';

type FilterTab = 'all' | 'today' | ListOrdersParams['statusGroup'];

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Pending', value: 'pending' },
  { label: 'Preparing', value: 'preparing' },
  { label: 'Ready', value: 'ready_for_pickup' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

const ORDER_STATUSES: OrderStatus[] = [
  'PAYMENT_PENDING', 'PAID', 'MERCHANT_ACCEPTED', 'PREPARING', 'PACKING',
  'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY',
  'DELIVERED', 'COMPLETED', 'CANCELLED_BY_BUYER', 'CANCELLED_BY_MERCHANT',
  'CANCELLED_BY_ADMIN', 'PAYMENT_FAILED', 'REFUNDED',
];

function formatStatus(status: OrderStatus): string {
  return status.replace(/_/g, ' ');
}

export function OrderMonitoringContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<FilterTab>('all');
  const [todayOnly, setTodayOnly] = useState(false);
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [storeId, setStoreId] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [riderId, setRiderId] = useState('');

  useEffect(() => {
    const today = searchParams.get('today') === 'true';
    const sg = searchParams.get('statusGroup') as FilterTab | null;
    const st = searchParams.get('status') as OrderStatus | null;
    const pm = searchParams.get('paymentMethod') as PaymentMethod | null;
    const ps = searchParams.get('paymentStatus') as PaymentStatus | null;
    setTodayOnly(today);
    if (sg) setTab(sg);
    else if (today) setTab('today');
    if (st) setStatus(st);
    if (pm) setPaymentMethod(pm);
    if (ps) setPaymentStatus(ps);
  }, [searchParams]);

  const queryParams: ListOrdersParams = {
    limit: 50,
    page: 1,
    ...((tab === 'today' || todayOnly) && { today: true }),
    ...(tab !== 'all' && tab !== 'today' && { statusGroup: tab }),
    ...(status && { status }),
    ...(paymentMethod && { paymentMethod }),
    ...(paymentStatus && { paymentStatus }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(storeId && { storeId }),
    ...(merchantId && { merchantId }),
    ...(riderId && { riderId }),
  };

  // Refetches the board whenever any order on the platform is created or moves.
  useAdminFleetRealtime();

  const { data, isLoading, isError, refetch } = useAdminOrdersQuery(queryParams);
  const orders = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTab(value);
              setTodayOnly(value === 'today');
            }}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              tab === value
                ? 'bg-primary text-white'
                : 'border border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs">
          <span className="text-muted-foreground">Status</span>
          <select
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus | '')}
          >
            <option value="">Any</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{formatStatus(s)}</option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="text-muted-foreground">Payment type</span>
          <select
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | '')}
          >
            <option value="">Any</option>
            <option value="COD">COD</option>
            <option value="RAZORPAY">Online</option>
          </select>
        </label>
        <label className="text-xs">
          <span className="text-muted-foreground">Payment status</span>
          <select
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus | '')}
          >
            <option value="">Any</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </label>
        <label className="text-xs">
          <span className="text-muted-foreground">Store ID</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5 text-sm" value={storeId} onChange={(e) => setStoreId(e.target.value)} placeholder="Filter by store" />
        </label>
        <label className="text-xs">
          <span className="text-muted-foreground">Merchant ID</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5 text-sm" value={merchantId} onChange={(e) => setMerchantId(e.target.value)} />
        </label>
        <label className="text-xs">
          <span className="text-muted-foreground">Rider ID</span>
          <input className="mt-1 w-full rounded border px-2 py-1.5 text-sm" value={riderId} onChange={(e) => setRiderId(e.target.value)} />
        </label>
        <label className="text-xs">
          <span className="text-muted-foreground">From</span>
          <input type="date" className="mt-1 w-full rounded border px-2 py-1.5 text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label className="text-xs">
          <span className="text-muted-foreground">To</span>
          <input type="date" className="mt-1 w-full rounded border px-2 py-1.5 text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading orders…</p>}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Failed to load orders.{' '}
          <button type="button" onClick={() => refetch()} className="underline">Retry</button>
        </div>
      )}

      {!isLoading && !isError && orders.length === 0 && (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          No orders match this filter.
        </p>
      )}

      {!isLoading && !isError && orders.length > 0 && (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Buyer</th>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Merchant</th>
                <th className="px-4 py-3">Rider</th>
                <th className="px-4 py-3">Order status</th>
                <th className="px-4 py-3">Assignment</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/orders/${order.id}`} className="text-primary hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{order.buyer?.name ?? '—'}</td>
                  <td className="px-4 py-3">{order.store?.name ?? '—'}</td>
                  <td className="px-4 py-3">{order.store?.merchant?.businessName ?? '—'}</td>
                  <td className="px-4 py-3">{order.rider?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {order.deliveryStatus?.replace(/_/g, ' ') ?? 'Unassigned'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {order.paymentMethod} / {order.paymentStatus}
                  </td>
                  <td className="px-4 py-3">₹{Number(order.totalAmount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.meta && (
            <p className="border-t px-4 py-2 text-xs text-muted-foreground">
              Showing {orders.length} of {data.meta.total} orders · auto-refresh every 15s
            </p>
          )}
        </div>
      )}
    </div>
  );
}
