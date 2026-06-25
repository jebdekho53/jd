import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ReviewsPageContent } from '@/features/reviews/reviews-page-content';

export const metadata: Metadata = { title: 'Reviews' };

export default function ReviewsPage() {
  return (
    <DashboardLayout>
      <ReviewsPageContent />
    </DashboardLayout>
  );
}
