import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StoreListContent } from '@/features/stores/store-list-content';

export const metadata: Metadata = { title: 'Stores' };

export default function StoresPage() {
  return (
    <DashboardLayout>
      <StoreListContent />
    </DashboardLayout>
  );
}
