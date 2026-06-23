import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { InventoryPageContent } from '@/features/inventory/inventory-page-content';

export const metadata: Metadata = { title: 'Inventory' };

export default function InventoryPage() {
  return (
    <DashboardLayout>
      <InventoryPageContent />
    </DashboardLayout>
  );
}
