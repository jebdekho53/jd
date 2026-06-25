import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AdminSettlementsContent } from '@/features/settlements/admin-settlements-content';

export const metadata: Metadata = { title: 'Settlements' };

export default function SettlementsPage() {
  return (
    <DashboardShell title="Merchant Settlements">
      <AdminSettlementsContent />
    </DashboardShell>
  );
}
