import { ProfileNotificationsContent } from '@/features/profile/profile-notifications-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Notifications',
  description: 'Control order, offer and delivery notifications.',
  path: '/profile/notifications',
});

export default function ProfileNotificationsPage() {
  return <ProfileNotificationsContent />;
}
