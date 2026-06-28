import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AdminClaimsPageContent } from '@/features/claims/admin-claims-page-content';

export const metadata: Metadata = { title: 'Returns & Claims' };

export default function RefundsPage() {
  return (
    <DashboardShell title="Returns & Claims">
      <AdminClaimsPageContent />
    </DashboardShell>
  );
}
