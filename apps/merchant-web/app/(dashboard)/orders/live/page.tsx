import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { OrdersLivePageContent } from '@/features/orders/orders-live-page';

export default function OrdersLivePage() {
  return (
    <DashboardLayout title="Live Orders">
      <OrdersLivePageContent />
    </DashboardLayout>
  );
}
