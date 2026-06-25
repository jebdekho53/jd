import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { FinanceAdminContent } from '@/features/finance/finance-admin-content';

export const metadata: Metadata = { title: 'Finance Center' };

export default function FinancePage() {
  return (
    <DashboardShell title="Finance Center">
      <FinanceAdminContent />
    </DashboardShell>
  );
}
