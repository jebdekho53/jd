import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { StoreApprovalsContent } from '@/features/stores/store-approvals-content';

export const metadata: Metadata = { title: 'Stores' };

export default function StoresPage() {
  return (
    <DashboardShell title="Store Governance">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <StoreApprovalsContent />
      </Suspense>
    </DashboardShell>
  );
}
