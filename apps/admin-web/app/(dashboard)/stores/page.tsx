import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export const metadata: Metadata = { title: 'Stores' };

export default function StoresPage() {
  return (
    <DashboardShell title="Store Governance">
      <FeaturePlaceholder
        title="Store approval system"
        description="Approve, reject, and suspend stores — Phase 2."
      />
    </DashboardShell>
  );
}
