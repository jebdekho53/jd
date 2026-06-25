import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export const metadata: Metadata = { title: 'Refunds' };

export default function RefundsPage() {
  return (
    <DashboardShell title="Refund Requests">
      <FeaturePlaceholder
        title="Refund queue"
        description="Review and process merchant refund requests — Phase 2."
      />
    </DashboardShell>
  );
}
