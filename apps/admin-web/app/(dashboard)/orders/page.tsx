import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export const metadata: Metadata = { title: 'Orders' };

export default function OrdersPage() {
  return (
    <DashboardShell title="Order Monitoring">
      <FeaturePlaceholder
        title="Live order table"
        description="Read-only order monitoring with status filters — Phase 2."
      />
    </DashboardShell>
  );
}
