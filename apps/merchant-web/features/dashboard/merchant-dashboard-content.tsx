'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  Bike,
  IndianRupee,
  Package,
  ShoppingBag,
  Star,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  DashboardError,
  DashboardSection,
  EmptyState,
  MetricCard,
} from '@/components/dashboard/dashboard-widgets';
import { Badge, Button, Skeleton } from '@/design-system/primitives';
import {
  useMerchantAnalyticsDashboardQuery,
  useMerchantComplianceDashboardQuery,
  useMerchantCustomersDashboardQuery,
  useMerchantDashboardOrdersQuery,
  useMerchantInventoryDashboardQuery,
  useMerchantNotificationsDashboardQuery,
  useMerchantOverviewQuery,
  useMerchantRidersDashboardQuery,
} from '@/hooks/use-dashboard';
import {
  useCancelOrderMutation,
  useConfirmOrderMutation,
  useMarkPreparingMutation,
  useMarkPackingMutation,
  useMarkReadyMutation,
} from '@/hooks/use-orders';
import { useStoreStore } from '@/store/store-store';
import { useQueryClient } from '@tanstack/react-query';
import { merchantDashboardKeys } from '@/hooks/use-dashboard';

const ORDER_TABS = [
  'NEW',
  'ACCEPTED',
  'PREPARING',
  'PACKING',
  'READY_FOR_PICKUP',
  'RIDER_ASSIGNED',
  'OUT_FOR_DELIVERY',
  'CANCELLED',
] as const;

function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function MerchantDashboardContent() {
  const { currentStore } = useStoreStore();
  const storeId = currentStore?.id;
  const [orderTab, setOrderTab] = useState<string>('NEW');
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7d' | '30d'>('7d');
  const qc = useQueryClient();

  const overview = useMerchantOverviewQuery(storeId);
  const orders = useMerchantDashboardOrdersQuery(storeId, orderTab);
  const inventory = useMerchantInventoryDashboardQuery(storeId);
  const riders = useMerchantRidersDashboardQuery(storeId);
  const analytics = useMerchantAnalyticsDashboardQuery(storeId, analyticsPeriod);
  const customers = useMerchantCustomersDashboardQuery(storeId);
  const compliance = useMerchantComplianceDashboardQuery(storeId);
  const notifications = useMerchantNotificationsDashboardQuery(storeId);

  const confirm = useConfirmOrderMutation();
  const preparing = useMarkPreparingMutation();
  const packing = useMarkPackingMutation();
  const ready = useMarkReadyMutation();
  const cancel = useCancelOrderMutation();

  const invalidateDashboard = () => {
    qc.invalidateQueries({ queryKey: merchantDashboardKeys.all });
  };

  const handleAction = async (action: 'confirm' | 'preparing' | 'packing' | 'ready' | 'cancel', id: string) => {
    if (action === 'confirm') await confirm.mutateAsync(id);
    if (action === 'preparing') await preparing.mutateAsync(id);
    if (action === 'packing') await packing.mutateAsync(id);
    if (action === 'ready') await ready.mutateAsync(id);
    if (action === 'cancel') await cancel.mutateAsync({ id, reason: 'Cancelled from dashboard' });
    invalidateDashboard();
  };

  const o = overview.data;

  return (
    <DashboardLayout title="Operations Center">
      <div className="space-y-10">
        {/* A — Business Health */}
        <DashboardSection title="Business health" description="Today at a glance">
          {overview.isError && (
            <DashboardError message="Failed to load overview" onRetry={() => overview.refetch()} />
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Today's orders" value={o?.todayOrders ?? 0} change={o?.growth?.ordersPct} icon={ShoppingBag} loading={overview.isLoading} sparkline={o?.sparkline} href="/orders?today=true" />
            <MetricCard label="Today's revenue" value={formatInr(o?.todayRevenue ?? 0)} change={o?.growth?.revenuePct} icon={IndianRupee} loading={overview.isLoading} prefix="" href="/orders?today=true" />
            <MetricCard label="Pending orders" value={o?.pendingOrders ?? 0} icon={TrendingUp} loading={overview.isLoading} href="/orders?statusGroup=new" />
            <MetricCard label="Preparing" value={o?.preparingOrders ?? 0} icon={Package} loading={overview.isLoading} href="/orders?merchantStatusGroup=preparing" />
            <MetricCard label="Packing" value={o?.packingOrders ?? 0} icon={Package} loading={overview.isLoading} href="/orders?merchantStatusGroup=packing" />
            <MetricCard label="Ready for pickup" value={o?.readyForPickup ?? 0} icon={Bike} loading={overview.isLoading} href="/orders?merchantStatusGroup=ready_for_pickup" />
            <MetricCard label="Delivered today" value={o?.deliveredToday ?? 0} icon={ShoppingBag} loading={overview.isLoading} href="/orders?merchantStatusGroup=delivered" />
            <MetricCard label="Cancelled today" value={o?.cancelledOrders ?? 0} icon={AlertTriangle} loading={overview.isLoading} href="/orders?merchantStatusGroup=cancelled" />
            <MetricCard label="Avg order value" value={formatInr(o?.avgOrderValue ?? 0)} icon={IndianRupee} loading={overview.isLoading} />
            <MetricCard label="Customer rating" value={`${o?.customerRating ?? 0} (${o?.ratingCount ?? 0})`} icon={Star} loading={overview.isLoading} />
          </div>
        </DashboardSection>

        {/* B — Live Orders */}
        <DashboardSection
          title="Live order operations"
          description="Auto-refreshes every 10s"
          action={<Link href="/orders/live" className="text-sm font-medium text-brand-600 hover:underline">Live mode →</Link>}
        >
          <div className="flex flex-wrap gap-2">
            {ORDER_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setOrderTab(tab)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  orderTab === tab ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white text-slate-600'
                }`}
              >
                {tab.replace(/_/g, ' ')}
                {orders.data?.tabs[tab] !== undefined && (
                  <span className="ml-1 opacity-80">({orders.data.tabs[tab]})</span>
                )}
              </button>
            ))}
          </div>
          {orders.isLoading && <Skeleton className="h-40 w-full" />}
          {orders.isError && <DashboardError message="Failed to load orders" onRetry={() => orders.refetch()} />}
          {!orders.isLoading && !orders.isError && orders.data?.orders.length === 0 && (
            <EmptyState message="No orders in this status." />
          )}
          {orders.data && orders.data.orders.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Rider</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.data.orders.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{row.orderNumber}</td>
                      <td className="px-4 py-3">{row.customerName}</td>
                      <td className="px-4 py-3">{row.itemsCount}</td>
                      <td className="px-4 py-3">{formatInr(row.amount)}</td>
                      <td className="px-4 py-3">{formatTime(row.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-600">{row.rider?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {row.status === 'PAID' && (
                            <Button size="sm" onClick={() => handleAction('confirm', row.id)}>Accept</Button>
                          )}
                          {row.status === 'MERCHANT_ACCEPTED' && (
                            <Button size="sm" onClick={() => handleAction('preparing', row.id)}>Prepare</Button>
                          )}
                          {row.status === 'PREPARING' && row.orderVertical === 'FOOD' && (
                            <Button size="sm" onClick={() => handleAction('ready', row.id)}>Ready</Button>
                          )}
                          {row.status === 'PREPARING' && row.orderVertical !== 'FOOD' && (
                            <Button size="sm" onClick={() => handleAction('packing', row.id)}>Pack</Button>
                          )}
                          {row.status === 'PACKING' && (
                            <Button size="sm" onClick={() => handleAction('ready', row.id)}>Ready</Button>
                          )}
                          {!['CANCELLED_BY_BUYER', 'CANCELLED_BY_MERCHANT', 'DELIVERED', 'COMPLETED'].includes(row.status) && (
                            <Button size="sm" variant="ghost" onClick={() => handleAction('cancel', row.id)}>Cancel</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardSection>

        {/* C — Riders */}
        <DashboardSection title="Rider monitoring" description="Refreshes every 15s">
          {riders.isLoading ? <Skeleton className="h-24 w-full" /> : (
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard label="Assigned riders" value={riders.data?.assignedRiders ?? 0} icon={Bike} />
              <MetricCard label="Online riders" value={riders.data?.onlineRiders ?? 0} icon={Bike} />
              <MetricCard label="Active deliveries" value={riders.data?.currentDeliveries ?? 0} icon={Package} />
            </div>
          )}
          {riders.data?.riders.length ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Rider</th>
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">ETA</th>
                  </tr>
                </thead>
                <tbody>
                  {riders.data.riders.map((r) => (
                    <tr key={r.riderId} className="border-b">
                      <td className="px-4 py-3">{r.name}<br /><span className="text-xs text-slate-500">{r.phone}</span></td>
                      <td className="px-4 py-3">{r.currentOrder.orderNumber}</td>
                      <td className="px-4 py-3"><Badge>{r.deliveryStatus}</Badge></td>
                      <td className="px-4 py-3">{r.etaMinutes ? `${r.etaMinutes} min` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !riders.isLoading && <EmptyState message="No active rider assignments." />
          )}
        </DashboardSection>

        {/* D — Inventory */}
        <DashboardSection title="Inventory health" action={<Link href="/inventory" className="text-sm text-brand-600">Manage →</Link>}>
          {inventory.isLoading ? <Skeleton className="h-20 w-full" /> : (
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Object.entries(inventory.data?.summary ?? {}).map(([k, v]) => (
                <MetricCard key={k} label={k.replace(/([A-Z])/g, ' $1')} value={v as number} icon={Package} />
              ))}
            </div>
          )}
          {inventory.data?.lowStockProducts.length ? (
            <div className="rounded-xl border bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Low stock</h3>
              <ul className="space-y-2 text-sm">
                {inventory.data.lowStockProducts.map((p) => (
                  <li key={p.variantId} className="flex justify-between">
                    <span>{p.productName}</span>
                    <span className="text-amber-600">{p.quantity} / {p.threshold}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </DashboardSection>

        {/* E — Analytics */}
        <DashboardSection
          title="Sales analytics"
          action={
            <div className="flex gap-2">
              {(['7d', '30d'] as const).map((p) => (
                <button key={p} type="button" onClick={() => setAnalyticsPeriod(p)} className={`rounded-lg px-3 py-1 text-xs font-medium ${analyticsPeriod === p ? 'bg-brand-600 text-white' : 'border'}`}>{p}</button>
              ))}
            </div>
          }
        >
          {analytics.isLoading ? <Skeleton className="h-64 w-full" /> : analytics.data && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Orders today" value={analytics.data.ordersToday} icon={ShoppingBag} />
                <MetricCard label="Orders this week" value={analytics.data.ordersThisWeek} icon={ShoppingBag} />
                <MetricCard label="Orders this month" value={analytics.data.ordersThisMonth} icon={ShoppingBag} />
                <MetricCard label="Acceptance rate" value={`${analytics.data.acceptanceRate}%`} icon={TrendingUp} />
                <MetricCard label="Cancellation rate" value={`${analytics.data.cancellationRate}%`} icon={AlertTriangle} />
              </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border bg-white p-4">
                <h3 className="mb-2 text-sm font-semibold">Revenue trend</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.data.revenueSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="#0f766e" fill="#ccfbf1" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <h3 className="mb-2 text-sm font-semibold">Hourly demand</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.data.hourlyDemand}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="orders" fill="#0f766e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            </div>
          )}
        </DashboardSection>

        {/* F — Categories via compliance */}
        <DashboardSection title="Category performance">
          {compliance.isLoading ? <Skeleton className="h-16 w-full" /> : compliance.data && (
            <div className="grid gap-4 sm:grid-cols-4">
              <MetricCard label="Approved" value={compliance.data.categoryRequests.approved} icon={Store} />
              <MetricCard label="Pending" value={compliance.data.categoryRequests.pending} icon={Store} />
              <MetricCard label="Rejected" value={compliance.data.categoryRequests.rejected} icon={Store} />
              <MetricCard label="Docs required" value={compliance.data.categoryRequests.documentsRequired} icon={Store} />
            </div>
          )}
        </DashboardSection>

        {/* G — Customers */}
        <DashboardSection title="Customer insights">
          {customers.isLoading ? <Skeleton className="h-20 w-full" /> : customers.data && (
            <>
              <div className="grid gap-4 sm:grid-cols-4">
                <MetricCard label="Total customers" value={customers.data.totalCustomers} icon={Users} />
                <MetricCard label="Returning" value={customers.data.returningCustomers} icon={Users} />
                <MetricCard label="New (30d)" value={customers.data.newCustomers} icon={Users} />
                <MetricCard label="Repeat %" value={`${customers.data.repeatPurchasePct}%`} icon={TrendingUp} />
              </div>
              {customers.data.recentReviews.length > 0 && (
                <div className="rounded-xl border bg-white p-4">
                  <h3 className="mb-2 text-sm font-semibold">Recent reviews</h3>
                  <ul className="space-y-2 text-sm">
                    {customers.data.recentReviews.map((r) => (
                      <li key={r.id} className="flex justify-between gap-4">
                        <span>{r.customerName} — {r.comment ?? 'No comment'}</span>
                        <span className="text-amber-500">{'★'.repeat(r.rating)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </DashboardSection>

        {/* H — Compliance */}
        <DashboardSection title="Store compliance">
          {compliance.data?.alerts.map((a) => (
            <div key={a.storeId} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
              <strong>{a.storeName}</strong>: {a.message} ({a.status})
            </div>
          ))}
        </DashboardSection>

        {/* I — Notifications */}
        <DashboardSection title="Notifications center">
          {notifications.isLoading ? <Skeleton className="h-16 w-full" /> : notifications.data && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-white p-4">
                <h3 className="text-sm font-semibold">Recent orders</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {notifications.data.recentOrders.map((o) => (
                    <li key={o.id}>{o.orderNumber} — {o.status}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <h3 className="text-sm font-semibold">Alerts</h3>
                <p className="mt-2 text-sm">Low stock items: <strong>{notifications.data.inventoryAlerts}</strong></p>
                <p className="text-sm">Pending category requests: <strong>{notifications.data.categoryRequests}</strong></p>
              </div>
            </div>
          )}
        </DashboardSection>
      </div>
    </DashboardLayout>
  );
}
