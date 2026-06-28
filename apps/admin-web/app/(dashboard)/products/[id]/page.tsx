import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AdminProductDetailContent } from '@/features/products/admin-product-detail-content';

export const metadata: Metadata = { title: 'Product audit' };

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <DashboardShell title="Product audit">
      <AdminProductDetailContent productId={id} />
    </DashboardShell>
  );
}
