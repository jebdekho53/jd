import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { FinancePageContent } from '@/features/finance/finance-page-content';

export const metadata: Metadata = { title: 'Finance' };

export default function MerchantFinancePage() {
  return (
    <DashboardLayout title="Finance overview">
      <FinancePageContent />
    </DashboardLayout>
  );
}
