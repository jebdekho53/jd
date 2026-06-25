import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AdminInventoryContent } from '@/features/inventory/admin-inventory-content';

export const metadata: Metadata = { title: 'Inventory Audit' };

export default function AdminInventoryPage() {
  return (
    <DashboardShell title="Inventory">
      <AdminInventoryContent />
    </DashboardShell>
  );
}
