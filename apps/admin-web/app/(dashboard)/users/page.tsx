import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { UsersPageContent } from '@/features/users/users-page-content';

export const metadata: Metadata = { title: 'Users' };

export default function UsersPage() {
  return (
    <DashboardShell title="User Management">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <UsersPageContent />
      </Suspense>
    </DashboardShell>
  );
}
