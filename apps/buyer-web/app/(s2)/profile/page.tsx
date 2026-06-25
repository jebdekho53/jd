import { ProfileDashboardContent } from '@/features/profile/profile-dashboard-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'My profile',
  description: 'Manage your JebDekho account, orders, addresses, and wishlist.',
  path: '/profile',
});

export default function ProfilePage() {
  return <ProfileDashboardContent />;
}
