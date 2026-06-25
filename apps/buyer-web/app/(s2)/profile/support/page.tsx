import { ProfileSupportContent } from '@/features/profile/profile-support-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Help & support',
  description: 'FAQs, contact support and report issues.',
  path: '/profile/support',
});

export default function ProfileSupportPage() {
  return <ProfileSupportContent />;
}
