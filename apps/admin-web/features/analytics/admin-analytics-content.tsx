'use client';

import { useState } from 'react';
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
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AdminMetricCard, AdminSection } from '@/components/dashboard/dashboard-widgets';
import {
  useAnalyticsExecutiveQuery,
  useAnalyticsSalesQuery,
  useAnalyticsSectionQuery,
} from '@/hooks/use-analytics';

function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

const TABS = [
  'Executive',
  'Sales',
  'Orders',
  'Customers',
  'Riders',
  'Geo',
  'Inventory',
  'Wallet',
  'Funnel',
] as const;

export function AdminAnalyticsContent() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Executive');
  const [granularity, setGranularity] = useState('daily');
  const executive = useAnalyticsExecutiveQuery();
  const sales = useAnalyticsSalesQuery(granularity);
  const orders = useAnalyticsSectionQuery<Record<string, number>>('orders');
  const customers = useAnalyticsSectionQuery<Record<string, unknown>>('customers');
  const riders = useAnalyticsSectionQuery<Record<string, unknown>>('riders');
  const geo = useAnalyticsSectionQuery<Record<string, unknown>>('geo');
  const inventory = useAnalyticsSectionQuery<Record<string, unknown>>('inventory');
  const wallet = useAnalyticsSectionQuery<Record<string, unknown>>('wallet-rewards');
  const funnel = useAnalyticsSectionQuery<Record<string, unknown>>('funnel');

  const e = executive.data;

  return (
    <DashboardShell title="Analytics & BI Control Tower">
      <p className="mb-6 text-sm text-muted-foreground">
        Snapshot-backed enterprise analytics — no live heavy queries for historical data
      </p>
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t ? 'bg-admin-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t}
          </button>
        ))}
        <a
          href="/api/admin/analytics/export?format=csv&range=7d&type=executive"
          className="ml-auto rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          Export CSV
        </a>
      </div>

      {tab === 'Executive' && (
        <div className="space-y-8">
          <AdminSection title="Executive KPIs" description={`As of ${e?.asOf ?? '—'} · ${e?.source ?? 'snapshot'}`}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <AdminMetricCard label="GMV" value={formatInr(e?.gmv ?? 0)} loading={executive.isLoading} />
              <AdminMetricCard label="Orders" value={e?.orders ?? '—'} loading={executive.isLoading} />
              <AdminMetricCard label="Revenue" value={formatInr(e?.revenue ?? 0)} loading={executive.isLoading} />
              <AdminMetricCard label="AOV" value={formatInr(e?.aov ?? 0)} loading={executive.isLoading} />
              <AdminMetricCard label="Active buyers" value={e?.activeBuyers ?? '—'} loading={executive.isLoading} />
              <AdminMetricCard label="Active merchants" value={e?.activeMerchants ?? '—'} loading={executive.isLoading} />
              <AdminMetricCard label="Active riders" value={e?.activeRiders ?? '—'} loading={executive.isLoading} />
              <AdminMetricCard label="Conversion %" value={`${e?.conversionRate ?? 0}%`} loading={executive.isLoading} />
              <AdminMetricCard label="Refund rate" value={`${e?.refundRate ?? 0}%`} loading={executive.isLoading} />
              <AdminMetricCard label="Wallet liability" value={formatInr(e?.walletLiability ?? 0)} loading={executive.isLoading} />
              <AdminMetricCard label="Reward liability" value={e?.rewardLiability ?? '—'} loading={executive.isLoading} />
              <AdminMetricCard
                label="Growth (orders)"
                value={`${e?.growthPct?.orders ?? 0}%`}
                loading={executive.isLoading}
              />
            </div>
          </AdminSection>
        </div>
      )}

      {tab === 'Sales' && (
        <AdminSection title="Sales analytics">
          <div className="mb-4 flex gap-2">
            {['hourly', 'daily', 'weekly', 'monthly'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGranularity(g)}
                className={`rounded px-2 py-1 text-xs capitalize ${
                  granularity === g ? 'bg-admin-600 text-white' : 'bg-muted'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          {sales.data?.comparisons && (
            <p className="mb-4 text-sm text-muted-foreground">
              {sales.data.comparisons.label}: {sales.data.comparisons.current.orders} orders vs{' '}
              {sales.data.comparisons.previous.orders} prior
            </p>
          )}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales.data?.series ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="#93c5fd" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminSection>
      )}

      {tab === 'Orders' && orders.data && (
        <AdminSection title="Order analytics">
          <div className="grid gap-4 sm:grid-cols-3">
            {Object.entries(orders.data)
              .filter(([k]) => !['source'].includes(k))
              .map(([k, v]) => (
                <AdminMetricCard key={k} label={k.replace(/([A-Z])/g, ' $1')} value={String(v)} />
              ))}
          </div>
        </AdminSection>
      )}

      {tab === 'Customers' && customers.data && (
        <AdminSection title="Customer analytics">
          <pre className="overflow-auto rounded-lg border bg-muted/30 p-4 text-xs">
            {JSON.stringify(customers.data, null, 2)}
          </pre>
        </AdminSection>
      )}

      {tab === 'Riders' && riders.data && (
        <AdminSection title="Rider analytics">
          <pre className="overflow-auto rounded-lg border bg-muted/30 p-4 text-xs">
            {JSON.stringify(riders.data, null, 2)}
          </pre>
        </AdminSection>
      )}

      {tab === 'Geo' && geo.data && (
        <AdminSection title="Geo analytics">
          <pre className="overflow-auto rounded-lg border bg-muted/30 p-4 text-xs">
            {JSON.stringify(geo.data, null, 2)}
          </pre>
        </AdminSection>
      )}

      {tab === 'Inventory' && inventory.data && (
        <AdminSection title="Inventory analytics">
          <pre className="overflow-auto rounded-lg border bg-muted/30 p-4 text-xs">
            {JSON.stringify(inventory.data, null, 2)}
          </pre>
        </AdminSection>
      )}

      {tab === 'Wallet' && wallet.data && (
        <AdminSection title="Wallet & rewards">
          <pre className="overflow-auto rounded-lg border bg-muted/30 p-4 text-xs">
            {JSON.stringify(wallet.data, null, 2)}
          </pre>
        </AdminSection>
      )}

      {tab === 'Funnel' && funnel.data && (
        <AdminSection title="Funnel analytics">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { step: 'Visitors', count: Number(funnel.data.visitors ?? 0) },
                  { step: 'Searches', count: Number(funnel.data.searches ?? 0) },
                  { step: 'Store views', count: Number(funnel.data.storeViews ?? 0) },
                  { step: 'Add to cart', count: Number(funnel.data.addToCart ?? 0) },
                  { step: 'Checkout', count: Number(funnel.data.checkoutStarted ?? 0) },
                  { step: 'Order', count: Number(funnel.data.orderCreated ?? 0) },
                  { step: 'Completed', count: Number(funnel.data.orderCompleted ?? 0) },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="step" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminSection>
      )}
    </DashboardShell>
  );
}
