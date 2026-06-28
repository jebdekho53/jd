import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RestaurantOpsContent } from '@/features/restaurant-ops/restaurant-ops-content';

export const metadata: Metadata = { title: 'Restaurant Operations' };

export default function RestaurantOpsPage() {
  return (
    <DashboardShell title="Restaurant Operations">
      <RestaurantOpsContent />
    </DashboardShell>
  );
}
