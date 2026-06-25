import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EarningsPageContent } from '@/features/earnings/earnings-page-content';

export const metadata: Metadata = { title: 'Earnings' };

export default function EarningsPage() {
  return (
    <DashboardLayout title="Earnings & Payouts">
      <EarningsPageContent />
    </DashboardLayout>
  );
}
