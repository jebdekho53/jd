import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StoreDetailContent } from '@/features/stores/store-detail-content';

export const metadata: Metadata = { title: 'Store Details' };

export default async function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <DashboardLayout>
      <StoreDetailContent storeId={id} />
    </DashboardLayout>
  );
}
