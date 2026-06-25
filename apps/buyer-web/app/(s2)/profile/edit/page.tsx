import { ProfileEditContent } from '@/features/profile/profile-edit-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Edit profile',
  description: 'Update your name, email and profile photo on JebDekho.',
  path: '/profile/edit',
});

export default function ProfileEditPage() {
  return <ProfileEditContent />;
}
