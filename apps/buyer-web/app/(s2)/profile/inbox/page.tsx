import { ProfileInboxContent } from '@/features/profile/profile-inbox-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Notifications inbox',
  description: 'Your order, delivery and support notifications.',
  path: '/profile/inbox',
});

export default function ProfileInboxPage() {
  return <ProfileInboxContent />;
}
