import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MerchantGrowthContent } from '@/features/growth/merchant-growth-content';

export const metadata: Metadata = { title: 'Growth' };

export default function MerchantGrowthPage() {
  return (
    <DashboardLayout title="Growth OS">
      <MerchantGrowthContent />
    </DashboardLayout>
  );
}
