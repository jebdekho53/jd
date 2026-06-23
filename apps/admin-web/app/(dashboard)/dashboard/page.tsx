import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <DashboardShell title="System Overview">
      <FeaturePlaceholder
        title="Dashboard module"
        description="Metrics widgets (orders, revenue, approvals, failed payments) will be implemented in Phase 2."
      />
    </DashboardShell>
  );
}
