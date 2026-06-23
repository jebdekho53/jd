import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProductsPageContent } from '@/features/products/products-page-content';

export const metadata: Metadata = { title: 'Products' };

export default function ProductsPage() {
  return (
    <DashboardLayout>
      <ProductsPageContent />
    </DashboardLayout>
  );
}
