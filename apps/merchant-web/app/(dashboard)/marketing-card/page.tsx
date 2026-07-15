import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MarketingCardContent } from '@/features/marketing-card/marketing-card-content';

export const metadata: Metadata = { title: 'My Card' };

export default function MarketingCardPage() {
  return (
    <DashboardLayout title="My Shareable Card">
      <MarketingCardContent />
    </DashboardLayout>
  );
}
