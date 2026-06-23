import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export const metadata: Metadata = { title: 'Order Details' };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <DashboardShell title="Order Detail">
      <FeaturePlaceholder
        title={`Order ${id}`}
        description="Order timeline and payment status — Phase 2."
      />
    </DashboardShell>
  );
}
