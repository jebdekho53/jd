import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RestaurantDashboardContent } from '@/features/restaurant/restaurant-dashboard-content';

export const metadata: Metadata = { title: 'Restaurant Dashboard' };

export default async function StoreRestaurantDashboardPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  return (
    <DashboardLayout title="Restaurant">
      <RestaurantDashboardContent storeId={storeId} />
    </DashboardLayout>
  );
}
