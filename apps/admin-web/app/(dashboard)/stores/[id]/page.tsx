import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { StoreDetailContent } from '@/features/stores/store-detail-content';

export const metadata: Metadata = { title: 'Store Details' };

export default async function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <DashboardShell title="Store Review">
      <StoreDetailContent storeId={id} />
    </DashboardShell>
  );
}
