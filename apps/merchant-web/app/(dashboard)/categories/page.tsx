import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { CategoriesPageContent } from '@/features/categories/categories-page-content';

export const metadata: Metadata = { title: 'Business Categories' };

export default function CategoriesPage() {
  return (
    <DashboardLayout>
      <CategoriesPageContent />
    </DashboardLayout>
  );
}
