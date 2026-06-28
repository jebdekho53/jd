import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { KitchenDisplayContent } from '@/features/restaurant/kitchen-display-content';

export const metadata: Metadata = { title: 'Kitchen Display' };

export default async function StoreKitchenPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  return (
    <DashboardLayout title="Kitchen">
      <KitchenDisplayContent storeId={storeId} />
    </DashboardLayout>
  );
}
