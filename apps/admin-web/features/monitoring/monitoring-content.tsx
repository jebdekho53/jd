'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock, CreditCard, Database, Radio, Truck } from 'lucide-react';
import {
  useAdminOverviewQuery,
  useAdminPaymentsDashboardQuery,
  useAdminSystemHealthQuery,
  useAdminUnassignedDashboardQuery,
} from '@/hooks/use-dashboard';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AdminMetricCard, AdminSection, HealthPill } from '@/components/dashboard/dashboard-widgets';
import { Badge, Button } from '@/design-system';

type Incident = {
  id: string;
  title: string;
  detail: string;
  severity: 'critical' | 'warning' | 'info';
  href: string;
};

function isHealthy(status?: string) {
  return ['up', 'healthy', 'configured', 'running', 'active'].includes(String(status));
}

function isMuted(status?: string) {
  return ['disabled', 'coming_soon', 'console', 'not_configured', 'unavailable'].includes(String(status));
}

function healthSeverity(status?: string): Incident['severity'] {
  if (isHealthy(status)) return 'info';
  if (isMuted(status)) return 'warning';
  return 'critical';
}

export function MonitoringContent() {
  const overview = useAdminOverviewQuery();
  const health = useAdminSystemHealthQuery();
  const payments = useAdminPaymentsDashboardQuery();
  const unassigned = useAdminUnassignedDashboardQuery();

  const o = overview.data;
  const h = health.data;
  const p = payments.data;
  const incidents: Incident[] = [
    ...(h
      ? [
          ['API', h.api, '/monitoring'],
          ['Database', h.database, '/monitoring'],
          ['Redis', h.redis, '/monitoring'],
          ['Queue', h.queueHealth, '/monitoring'],
          ['WebSocket', h.websocket, '/fleet/live'],
          ['Background jobs', h.backgroundJobs, '/monitoring'],
          ['Cron', h.cronStatus, '/monitoring'],
          ['SMS', h.sms, '/monitoring'],
          ['Shadowfax', h.shadowfax, '/logistics'],
          ['Push notifications', h.pushNotifications, '/monitoring'],
        ]
          .filter(([, status]) => !isHealthy(String(status)))
          .map(([label, status, href]) => ({
            id: `health-${label}`,
            title: `${label} is ${status ?? 'unknown'}`,
            detail: 'Infrastructure health signal needs admin attention.',
            severity: healthSeverity(String(status)),
            href: String(href),
          }))
      : []),
    ...(p?.failedPayments
      ? [{
          id: 'failed-payments',
          title: `${p.failedPayments} failed payments`,
          detail: 'Payment failures may need refund/order reconciliation.',
          severity: p.failedPayments > 10 ? 'critical' : 'warning',
          href: '/orders?paymentStatus=FAILED',
        } satisfies Incident]
      : []),
    ...(unassigned.data?.count
      ? [{
          id: 'unassigned-orders',
          title: `${unassigned.data.count} unassigned orders`,
          detail: `${unassigned.data.availableRiders} riders currently available.`,
          severity: unassigned.data.count > 5 ? 'critical' : 'warning',
          href: '/orders/unassigned',
        } satisfies Incident]
      : []),
    ...(h?.pendingCheckouts
      ? [{
          id: 'pending-checkouts',
          title: `${h.pendingCheckouts} pending checkouts`,
          detail: 'Checkout queue has pending work.',
          severity: h.pendingCheckouts > 20 ? 'critical' : 'warning',
          href: '/monitoring',
        } satisfies Incident]
      : []),
  ];
  const criticalCount = incidents.filter((i) => i.severity === 'critical').length;

  return (
    <DashboardShell title="System Monitoring">
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatusCard icon={criticalCount ? AlertTriangle : CheckCircle2} label="Critical incidents" value={criticalCount} tone={criticalCount ? 'danger' : 'success'} />
          <StatusCard icon={Clock} label="Pending checkouts" value={h?.pendingCheckouts ?? '—'} tone={h?.pendingCheckouts ? 'warning' : 'neutral'} />
          <StatusCard icon={CreditCard} label="Failed payments" value={p?.failedPayments ?? '—'} tone={p?.failedPayments ? 'danger' : 'neutral'} />
          <StatusCard icon={Truck} label="Unassigned orders" value={unassigned.data?.count ?? '—'} tone={unassigned.data?.count ? 'warning' : 'neutral'} />
        </div>

        <AdminSection title="Live system status" description="Refreshes automatically">
          {health.data && (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <HealthPill label="API" status={health.data.api} href="/monitoring" />
              <HealthPill label="Database" status={health.data.database} href="/monitoring" />
              <HealthPill label="Redis" status={health.data.redis} href="/monitoring" />
              <HealthPill label="Queue" status={health.data.queueHealth} href="/monitoring" />
              <HealthPill label="WebSocket" status={health.data.websocket} href="/fleet/live" />
              <HealthPill label="Cron" status={health.data.cronStatus} href="/monitoring" />
              <HealthPill label="SMS" status={health.data.sms} href="/monitoring" />
              <HealthPill label="WhatsApp" status={health.data.whatsapp ?? 'coming_soon'} href="/monitoring" />
              <HealthPill label="Email" status={health.data.email ?? 'unknown'} href="/monitoring" />
              <HealthPill label="Google Maps" status={health.data.googleMaps ?? 'unknown'} href="/monitoring" />
              <HealthPill label="Shadowfax" status={health.data.shadowfax ?? 'unknown'} href="/logistics" />
              <HealthPill label="Background jobs" status={health.data.backgroundJobs} href="/monitoring" />
              <HealthPill label="Push" status={health.data.pushNotifications} href="/monitoring" />
            </div>
          )}
        </AdminSection>

        <AdminSection
          title="Incident queue"
          description="Generated from system health, payments, logistics and checkout queues"
          action={<Button size="sm" variant="outline" onClick={() => { overview.refetch(); health.refetch(); payments.refetch(); unassigned.refetch(); }}>Refresh all</Button>}
        >
          <div className="rounded-xl border bg-white">
            {!incidents.length ? (
              <div className="flex items-center gap-3 p-4 text-sm text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                No active monitoring incidents.
              </div>
            ) : (
              <ul className="divide-y">
                {incidents.map((incident) => (
                  <li key={incident.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge tone={incident.severity === 'critical' ? 'danger' : incident.severity === 'warning' ? 'warning' : 'info'} dot>
                          {incident.severity}
                        </Badge>
                        <p className="font-medium text-slate-900">{incident.title}</p>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{incident.detail}</p>
                    </div>
                    <Link href={incident.href} className="text-sm font-medium text-admin-700 hover:underline">
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </AdminSection>

        {payments.data && (
          <AdminSection title="Payment health" action={<Link href="/orders" className="text-sm text-primary">All orders →</Link>}>
            <div className="grid gap-4 sm:grid-cols-3">
              <AdminMetricCard label="Paid today" value={payments.data.paidOrdersToday} href="/orders?today=true" />
              <AdminMetricCard label="COD today" value={payments.data.codOrdersToday} href="/orders?today=true&paymentMethod=COD" />
              <AdminMetricCard label="Failed payments" value={payments.data.failedPayments} href="/orders?paymentStatus=FAILED" />
            </div>
          </AdminSection>
        )}

        <AdminSection title="Queue and logistics" action={<Link href="/logistics" className="text-sm text-primary">Logistics →</Link>}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminMetricCard label="Queue health" value={h?.queueHealth ?? '—'} loading={health.isLoading} />
            <AdminMetricCard label="Pending checkouts" value={h?.pendingCheckouts ?? '—'} loading={health.isLoading} />
            <AdminMetricCard label="Available riders" value={unassigned.data?.availableRiders ?? '—'} loading={unassigned.isLoading} href="/riders/live" />
            <AdminMetricCard label="Shadowfax" value={h?.shadowfax ?? '—'} loading={health.isLoading} href="/logistics" />
          </div>
        </AdminSection>
      </div>
    </DashboardShell>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Database;
  label: string;
  value: string | number;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
}) {
  const colors = {
    success: 'text-emerald-700 bg-emerald-50',
    warning: 'text-amber-700 bg-amber-50',
    danger: 'text-red-700 bg-red-50',
    neutral: 'text-slate-700 bg-slate-50',
  };
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colors[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
