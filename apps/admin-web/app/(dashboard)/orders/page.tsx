import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { OrderMonitoringContent } from '@/features/orders/order-monitoring-content';

export const metadata: Metadata = { title: 'Orders' };

export default function OrdersPage() {
  return (
    <DashboardShell title="Order Monitoring">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <OrderMonitoringContent />
      </Suspense>
    </DashboardShell>
  );
}
