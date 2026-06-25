import { ProfilePaymentsContent } from '@/features/profile/profile-payments-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Payment methods',
  description: 'Manage UPI, cards and net banking for faster checkout.',
  path: '/profile/payments',
});

export default function ProfilePaymentsPage() {
  return <ProfilePaymentsContent />;
}
