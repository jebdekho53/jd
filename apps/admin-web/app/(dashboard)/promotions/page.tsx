import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PromotionsAdminContent } from '@/features/promotions/promotions-admin-content';

export const metadata: Metadata = { title: 'Promotion Control' };

export default function AdminPromotionsPage() {
  return (
    <DashboardShell title="Promotion Control">
      <PromotionsAdminContent />
    </DashboardShell>
  );
}
