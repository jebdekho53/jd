import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ProductsContent } from '@/features/products/products-content';

export const metadata: Metadata = { title: 'Products' };

export default function ProductsPage() {
  return (
    <DashboardShell title="Products">
      <ProductsContent />
    </DashboardShell>
  );
}
