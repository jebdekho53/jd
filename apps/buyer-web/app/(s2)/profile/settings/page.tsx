import { ProfileSettingsContent } from '@/features/profile/profile-settings-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Settings',
  description: 'App preferences including dark mode and language.',
  path: '/profile/settings',
});

export default function ProfileSettingsPage() {
  return <ProfileSettingsContent />;
}
