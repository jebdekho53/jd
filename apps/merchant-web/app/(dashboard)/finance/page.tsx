import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EarningsPageContent } from '@/features/earnings/earnings-page-content';

export const metadata: Metadata = { title: 'Finance' };

export default function MerchantFinancePage() {
  return (
    <DashboardLayout title="Finance">
      <EarningsPageContent />
    </DashboardLayout>
  );
}
