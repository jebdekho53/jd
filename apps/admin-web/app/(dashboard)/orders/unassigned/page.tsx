import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { UnassignedOrdersContent } from '@/features/orders/unassigned-orders-content';

export const metadata: Metadata = { title: 'Unassigned Orders' };

export default function UnassignedOrdersPage() {
  return (
    <DashboardShell title="Unassigned Orders">
      <UnassignedOrdersContent />
    </DashboardShell>
  );
}
