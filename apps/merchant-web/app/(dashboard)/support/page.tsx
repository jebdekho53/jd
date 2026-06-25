import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MerchantSupportContent } from '@/features/support/merchant-support-content';

export const metadata: Metadata = { title: 'Support' };

export default function MerchantSupportPage() {
  return (
    <DashboardLayout title="Support">
      <MerchantSupportContent />
    </DashboardLayout>
  );
}
