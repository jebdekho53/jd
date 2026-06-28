'use client';

import Link from 'next/link';
import {
  useAdminOverviewQuery,
  useAdminPaymentsDashboardQuery,
  useAdminSystemHealthQuery,
  useAdminUnassignedDashboardQuery,
} from '@/hooks/use-dashboard';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AdminMetricCard, AdminSection, HealthPill } from '@/components/dashboard/dashboard-widgets';

export function MonitoringContent() {
  const overview = useAdminOverviewQuery();
  const health = useAdminSystemHealthQuery();
  const payments = useAdminPaymentsDashboardQuery();
  const unassigned = useAdminUnassignedDashboardQuery();

  const o = overview.data;

  return (
    <DashboardShell title="System Monitoring">
      <div className="space-y-8">
        <AdminSection title="Live system status" description="Refreshes automatically">
          {health.data && (
            <div className="flex flex-wrap gap-2">
              <HealthPill label="API" status={health.data.api} href="/monitoring" />
              <HealthPill label="Database" status={health.data.database} href="/monitoring" />
              <HealthPill label="Redis" status={health.data.redis} href="/monitoring" />
              <HealthPill label="WebSocket" status={health.data.websocket} href="/fleet/live" />
              <HealthPill label="Cron" status={health.data.cronStatus} href="/monitoring" />
              <HealthPill label="SMS" status={health.data.sms} href="/monitoring" />
              <HealthPill label="WhatsApp" status={health.data.whatsapp ?? 'coming_soon'} href="/monitoring" />
              <HealthPill label="Email" status={health.data.email ?? 'unknown'} href="/monitoring" />
              <HealthPill label="Google Maps" status={health.data.googleMaps ?? 'unknown'} href="/monitoring" />
              <HealthPill label="Shadowfax" status={health.data.shadowfax ?? 'unknown'} href="/logistics" />
              <HealthPill label="Background jobs" status={health.data.backgroundJobs} href="/monitoring" />
            </div>
          )}
        </AdminSection>

        <AdminSection title="Operational alerts">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminMetricCard
              label="Failed payments"
              value={o?.failedPayments ?? '—'}
              loading={overview.isLoading}
              href="/orders?paymentStatus=FAILED"
            />
            <AdminMetricCard
              label="Unassigned orders"
              value={unassigned.data?.count ?? '—'}
              loading={unassigned.isLoading}
              href="/orders/unassigned"
            />
            <AdminMetricCard
              label="Cancelled today"
              value={o?.cancelledOrdersToday ?? '—'}
              loading={overview.isLoading}
              href="/orders?statusGroup=cancelled&today=true"
            />
            <AdminMetricCard
              label="Pending store approvals"
              value={o?.pendingStores ?? '—'}
              loading={overview.isLoading}
              href="/stores?status=PENDING"
            />
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
      </div>
    </DashboardShell>
  );
}
