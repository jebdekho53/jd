import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProductDetailContent } from '@/features/products/product-detail-content';

export const metadata: Metadata = { title: 'Product Details' };

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <DashboardLayout>
      <ProductDetailContent productId={id} />
    </DashboardLayout>
  );
}
