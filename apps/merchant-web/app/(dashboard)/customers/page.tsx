import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MerchantCustomersContent } from '@/features/crm/merchant-customers-content';

export const metadata: Metadata = { title: 'Customers' };

export default function MerchantCustomersPage() {
  return (
    <DashboardLayout title="Customers">
      <MerchantCustomersContent />
    </DashboardLayout>
  );
}
