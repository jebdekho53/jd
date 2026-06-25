import { ProfileSecurityContent } from '@/features/profile/profile-security-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Security',
  description: 'Manage login sessions and account security.',
  path: '/profile/security',
});

export default function ProfileSecurityPage() {
  return <ProfileSecurityContent />;
}
