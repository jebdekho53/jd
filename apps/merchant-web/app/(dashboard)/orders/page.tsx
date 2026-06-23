import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { OrdersPageContent } from '@/features/orders/orders-page-content';

export const metadata: Metadata = { title: 'Orders' };

export default function OrdersPage() {
  return (
    <DashboardLayout>
      <OrdersPageContent />
    </DashboardLayout>
  );
}
