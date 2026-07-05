import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { CommissionRulesContent } from '@/features/finance/commission-rules-content';

export const metadata: Metadata = { title: 'Commission Rules' };

export default function CommissionRulesPage() {
  return (
    <DashboardShell title="Commission Rules">
      <CommissionRulesContent />
    </DashboardShell>
  );
}
