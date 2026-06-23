import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export const metadata: Metadata = { title: 'Store Details' };

export default async function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <DashboardShell title="Store Review">
      <FeaturePlaceholder
        title={`Store ${id}`}
        description="Store detail, merchant profile, and audit logs — Phase 2."
      />
    </DashboardShell>
  );
}
