import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PromotionsPageContent } from '@/features/promotions/promotions-page-content';

export const metadata: Metadata = { title: 'Promotions' };

export default function PromotionsPage() {
  return (
    <DashboardLayout>
      <PromotionsPageContent />
    </DashboardLayout>
  );
}
