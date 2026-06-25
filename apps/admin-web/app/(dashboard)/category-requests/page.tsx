import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { CategoryRequestsContent } from '@/features/categories/category-requests-content';

export const metadata: Metadata = { title: 'Category Requests' };

export default function CategoryRequestsPage() {
  return (
    <DashboardShell title="Category Requests">
      <CategoryRequestsContent />
    </DashboardShell>
  );
}
