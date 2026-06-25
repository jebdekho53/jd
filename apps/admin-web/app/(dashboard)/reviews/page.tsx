import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ReviewsModerationContent } from '@/features/reviews/reviews-moderation-content';

export const metadata: Metadata = { title: 'Review Moderation' };

export default function AdminReviewsPage() {
  return (
    <DashboardShell title="Review Moderation">
      <ReviewsModerationContent />
    </DashboardShell>
  );
}
