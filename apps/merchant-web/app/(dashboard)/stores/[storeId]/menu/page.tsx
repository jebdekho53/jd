import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MenuManagementContent } from '@/features/restaurant/menu-management-content';

export const metadata: Metadata = { title: 'Menu Management' };

export default async function StoreMenuPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  return (
    <DashboardLayout title="Menu">
      <MenuManagementContent storeId={storeId} />
    </DashboardLayout>
  );
}
