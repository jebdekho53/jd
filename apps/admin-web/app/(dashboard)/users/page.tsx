import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export const metadata: Metadata = { title: 'Users' };

export default function UsersPage() {
  return (
    <DashboardShell title="User Management">
      <FeaturePlaceholder
        title="User directory"
        description="Filter by role, view profiles, suspend users — Phase 2."
      />
    </DashboardShell>
  );
}
