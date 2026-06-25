'use client';

import Link from 'next/link';
import {
  useAdminCategoriesDashboardQuery,
  useAdminCustomersDashboardQuery,
  useAdminDashboardOrdersQuery,
  useAdminFraudDashboardQuery,
  useAdminOverviewQuery,
  useAdminPaymentsDashboardQuery,
  useAdminRidersDashboardQuery,
  useAdminStoresDashboardQuery,
  useAdminSystemHealthQuery,
  useAdminUnassignedDashboardQuery,
} from '@/hooks/use-dashboard';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AdminMetricCard, AdminSection, HealthPill, MiniTrend } from '@/components/dashboard/dashboard-widgets';

function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export function AdminDashboardContent() {
  const overview = useAdminOverviewQuery();
  const orders = useAdminDashboardOrdersQuery(true);
  const stores = useAdminStoresDashboardQuery();
  const riders = useAdminRidersDashboardQuery();
  const unassigned = useAdminUnassignedDashboardQuery();
  const payments = useAdminPaymentsDashboardQuery();
  const customers = useAdminCustomersDashboardQuery();
  const categories = useAdminCategoriesDashboardQuery();
  const fraud = useAdminFraudDashboardQuery();
  const health = useAdminSystemHealthQuery();

  const o = overview.data;

  return (
    <DashboardShell title="Platform Command Center">
      <div className="space-y-10">
        {/* A — Platform Health */}
        <AdminSection title="Platform health" description="Real-time platform KPIs — click any card to drill down">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <AdminMetricCard label="Total users" value={o?.totalUsers ?? '—'} loading={overview.isLoading} href="/users" />
            <AdminMetricCard label="Total buyers" value={o?.totalBuyers ?? '—'} loading={overview.isLoading} href="/users?role=BUYER" />
            <AdminMetricCard label="Total merchants" value={o?.totalMerchants ?? '—'} loading={overview.isLoading} href="/users?role=MERCHANT" />
            <AdminMetricCard label="Total riders" value={o?.totalRiders ?? '—'} loading={overview.isLoading} href="/users?role=RIDER" />
            <AdminMetricCard label="Total stores" value={o?.totalStores ?? '—'} loading={overview.isLoading} href="/stores" />
            <AdminMetricCard label="Total orders" value={o?.totalOrders ?? '—'} loading={overview.isLoading} href="/orders" />
            <AdminMetricCard label="Orders today" value={o?.ordersToday ?? '—'} loading={overview.isLoading} href="/orders?today=true" />
            <AdminMetricCard label="GMV today" value={formatInr(o?.gmvToday ?? 0)} loading={overview.isLoading} href="/orders?today=true" />
            <AdminMetricCard label="GMV this month" value={formatInr(o?.gmvThisMonth ?? 0)} loading={overview.isLoading} href="/orders" />
            <AdminMetricCard label="Approved stores" value={o?.approvedStores ?? '—'} loading={overview.isLoading} href="/stores?status=APPROVED" />
            <AdminMetricCard label="Pending stores" value={o?.pendingStores ?? '—'} loading={overview.isLoading} href="/stores?status=PENDING" />
            <AdminMetricCard label="Rejected stores" value={o?.rejectedStores ?? '—'} loading={overview.isLoading} href="/stores?status=REJECTED" />
            <AdminMetricCard label="Active riders" value={o?.activeRiders ?? '—'} loading={overview.isLoading} href="/riders" />
            <AdminMetricCard label="Online riders" value={o?.onlineRiders ?? '—'} loading={overview.isLoading} href="/riders?status=ONLINE" />
            <AdminMetricCard label="New users today" value={o?.newUsersToday ?? '—'} loading={overview.isLoading} href="/users" />
            <AdminMetricCard label="Cancelled today" value={o?.cancelledOrdersToday ?? '—'} loading={overview.isLoading} href="/orders?status=CANCELLED" />
            <AdminMetricCard label="Failed payments" value={o?.failedPayments ?? '—'} loading={overview.isLoading} href="/orders?paymentStatus=FAILED" />
          </div>
        </AdminSection>

        {/* B — Order Command Center */}
        <AdminSection
          title="Order command center"
          description="Live orders — refreshes every 10s"
          action={<Link href="/orders" className="text-sm font-medium text-primary hover:underline">Full monitor →</Link>}
        >
          {orders.isLoading && <p className="text-sm text-muted-foreground">Loading orders…</p>}
          {orders.isError && (
            <p className="text-sm text-red-600">Failed to load orders. <button type="button" onClick={() => orders.refetch()} className="underline">Retry</button></p>
          )}
          {orders.data && orders.data.orders.length > 0 && (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Buyer</th>
                    <th className="px-4 py-3">Store</th>
                    <th className="px-4 py-3">Rider</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">ETA</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.data.orders.map((row) => (
                    <tr key={row.id} className="border-b">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/orders/${row.id}`} className="text-primary hover:underline">{row.orderNumber}</Link>
                      </td>
                      <td className="px-4 py-3">{row.buyer}</td>
                      <td className="px-4 py-3">{row.store}<br /><span className="text-xs text-muted-foreground">{row.city}</span></td>
                      <td className="px-4 py-3">{row.rider ?? '—'}</td>
                      <td className="px-4 py-3">{formatInr(row.amount)}</td>
                      <td className="px-4 py-3 text-xs">{row.status.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3">{row.deliveryEta ? `${row.deliveryEta}m` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {orders.data?.orders.length === 0 && !orders.isLoading && (
            <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">No orders today.</p>
          )}
        </AdminSection>

        {/* C — Store Governance */}
        <AdminSection title="Store governance" action={<Link href="/stores" className="text-sm text-primary">Approvals →</Link>}>
          {stores.data && (
            <>
              <div className="flex flex-wrap gap-2 text-sm">
                {Object.entries(stores.data.summary).map(([status, count]) => (
                  <Link
                    key={status}
                    href={`/stores?status=${status}`}
                    className="rounded-full border bg-card px-3 py-1 transition-colors hover:border-primary/50 hover:bg-muted/40"
                  >
                    {status}: {count}
                  </Link>
                ))}
              </div>
              <div className="overflow-x-auto rounded-lg border bg-card">
                <table className="min-w-full text-sm">
                  <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Store</th>
                      <th className="px-4 py-3 text-left">Merchant</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stores.data.stores.map((s) => (
                      <tr key={s.id} className="border-b">
                        <td className="px-4 py-3"><Link href={`/stores/${s.id}`} className="font-medium text-primary hover:underline">{s.name}</Link></td>
                        <td className="px-4 py-3">{s.merchant}</td>
                        <td className="px-4 py-3">{s.status}</td>
                        <td className="px-4 py-3">{s.riskScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </AdminSection>

        {/* D — Categories */}
        <AdminSection title="Category governance" action={<Link href="/category-requests" className="text-sm text-primary">Requests →</Link>}>
          {categories.data && (
            <div className="grid gap-4 sm:grid-cols-4">
              <AdminMetricCard label="Global categories" value={categories.data.totalCategories} href="/catalog" />
              <AdminMetricCard label="Pending requests" value={categories.data.pendingRequests} href="/category-requests" />
              {categories.data.topCategories.slice(0, 3).map((c) => (
                <AdminMetricCard key={c.categoryId ?? c.name} label={c.name} value={c.productCount} sub="products" href="/catalog" />
              ))}
            </div>
          )}
        </AdminSection>

        {/* E — Riders */}
        <AdminSection title="Rider control center" action={<Link href="/riders" className="text-sm text-primary">All riders →</Link>}>
          {riders.data && (
            <>
              <div className="grid gap-4 sm:grid-cols-5">
                <AdminMetricCard label="Online" value={riders.data.online} href="/riders?status=ONLINE" />
                <AdminMetricCard label="Offline" value={riders.data.offline} href="/riders?status=OFFLINE" />
                <AdminMetricCard label="Busy" value={riders.data.busy} href="/riders?status=BUSY" />
                <AdminMetricCard label="Available" value={riders.data.available} href="/riders?status=AVAILABLE" />
                <AdminMetricCard label="Pending KYC" value={riders.data.pendingKyc} href="/riders?kyc=PENDING" />
              </div>
              <div className="overflow-x-auto rounded-lg border bg-card">
                <table className="min-w-full text-sm">
                  <thead className="border-b text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Rider</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">KYC</th>
                      <th className="px-4 py-3 text-left">Current order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riders.data.riders.map((r) => (
                      <tr key={r.id} className="border-b">
                        <td className="px-4 py-3">{r.name}<br /><span className="text-xs text-muted-foreground">{r.phone}</span></td>
                        <td className="px-4 py-3">{r.status}</td>
                        <td className="px-4 py-3">{r.kycStatus}</td>
                        <td className="px-4 py-3">{r.currentOrder ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </AdminSection>

        {/* F — Unassigned */}
        <AdminSection
          title="Unassigned orders"
          description={`${unassigned.data?.count ?? 0} waiting · ${unassigned.data?.availableRiders ?? 0} riders available`}
          action={<Link href="/orders/unassigned" className="text-sm text-primary">Assignment queue →</Link>}
        >
          {unassigned.data?.orders.length ? (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="min-w-full text-sm">
                <thead className="border-b text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left">Store</th>
                    <th className="px-4 py-3 text-left">Zone</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Waiting</th>
                  </tr>
                </thead>
                <tbody>
                  {unassigned.data.orders.map((row) => (
                    <tr key={row.id} className="border-b">
                      <td className="px-4 py-3"><Link href="/orders/unassigned" className="text-primary hover:underline">{row.orderNumber}</Link></td>
                      <td className="px-4 py-3">{row.store}</td>
                      <td className="px-4 py-3">{row.zone}</td>
                      <td className="px-4 py-3">{formatInr(row.amount)}</td>
                      <td className="px-4 py-3">{new Date(row.waitingSince).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">No unassigned orders.</p>
          )}
        </AdminSection>

        {/* G — Customers */}
        <AdminSection title="Customer monitoring">
          {customers.data && (
            <div className="grid gap-4 sm:grid-cols-4">
              <AdminMetricCard label="Buyers today" value={customers.data.usersToday} href="/users?role=BUYER" />
              <AdminMetricCard label="Active buyers" value={customers.data.activeUsers} href="/users?role=BUYER" />
              <AdminMetricCard label="Repeat buyers (30d)" value={customers.data.repeatBuyers} href="/users?role=BUYER" />
              <AdminMetricCard label="Suspended users" value={customers.data.suspiciousUsers} href="/users" />
              <AdminMetricCard label="Refund requests" value={customers.data.refundRequests} href="/payments/refunds" />
            </div>
          )}
        </AdminSection>

        {/* H — Payments */}
        <AdminSection title="Payment monitoring">
          {payments.data && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminMetricCard label="COD today" value={payments.data.codOrdersToday} href="/orders?today=true" />
                <AdminMetricCard label="Paid today" value={payments.data.paidOrdersToday} href="/orders?today=true" />
                <AdminMetricCard label="Failed" value={payments.data.failedPayments} href="/orders?paymentStatus=FAILED" />
                <AdminMetricCard label="Refunds" value={payments.data.refunds} href="/payments/refunds" />
              </div>
              <div className="rounded-lg border bg-card p-4">
                <h3 className="mb-2 text-sm font-semibold">7-day revenue</h3>
                <MiniTrend data={payments.data.revenueTrend} />
              </div>
            </div>
          )}
        </AdminSection>

        {/* I — System Health */}
        <AdminSection
          title="System health"
          action={<Link href="/monitoring" className="text-sm text-primary">Monitoring →</Link>}
        >
          {health.data && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <HealthPill label="API" status={health.data.api} href="/monitoring" />
              <HealthPill label="Database" status={health.data.database} href="/monitoring" />
              <HealthPill label="Redis" status={health.data.redis} href="/monitoring" />
              <HealthPill label="Queue" status={health.data.queueHealth} href="/monitoring" />
              <HealthPill label="WebSocket" status={health.data.websocket} href="/monitoring" />
              <HealthPill label="Cron" status={health.data.cronStatus} href="/monitoring" />
              <HealthPill label="SMS" status={health.data.sms} href="/monitoring" />
              <HealthPill label="Push" status={health.data.pushNotifications} href="/monitoring" />
              <HealthPill label="Background jobs" status={health.data.backgroundJobs} href="/monitoring" />
            </div>
          )}
        </AdminSection>

        {/* J — Fraud */}
        <AdminSection title="Fraud & risk">
          {fraud.data && (
            <>
              <div className="grid gap-4 sm:grid-cols-4">
                <AdminMetricCard label="Rejected merchants" value={fraud.data.rejectedMerchants} href="/stores?status=REJECTED" />
                <AdminMetricCard label="Blocked users" value={fraud.data.blockedUsers} href="/users" />
                <AdminMetricCard label="Failed KYC" value={fraud.data.failedVerifications} href="/riders?kyc=REJECTED" />
                <AdminMetricCard label="Blacklisted" value={fraud.data.duplicateAccounts} href="/stores?status=BLACKLISTED" />
              </div>
              <ul className="rounded-lg border bg-card divide-y text-sm">
                {fraud.data.riskEvents.map((e) => (
                  <li key={e.id} className="flex justify-between px-4 py-2">
                    <span>{e.type} · {e.resource}</span>
                    <span className="text-muted-foreground">{new Date(e.at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </AdminSection>
      </div>
    </DashboardShell>
  );
}
