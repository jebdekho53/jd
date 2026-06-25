import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { CatalogManagementContent } from '@/features/categories/catalog-management-content';

export const metadata: Metadata = { title: 'Catalog Management' };

export default function CatalogPage() {
  return (
    <DashboardShell title="Catalog Management">
      <CatalogManagementContent />
    </DashboardShell>
  );
}
