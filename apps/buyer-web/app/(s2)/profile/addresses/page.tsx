import { ProfileAddressesContent } from '@/features/profile/profile-addresses-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Saved addresses',
  description: 'Manage your home, work and other delivery addresses.',
  path: '/profile/addresses',
});

export default function ProfileAddressesPage() {
  return <ProfileAddressesContent />;
}
