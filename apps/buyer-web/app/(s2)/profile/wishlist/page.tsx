import { ProfileWishlistContent } from '@/features/profile/profile-wishlist-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Wishlist',
  description: 'Your saved grocery products on JebDekho.',
  path: '/profile/wishlist',
});

export default function ProfileWishlistPage() {
  return <ProfileWishlistContent />;
}
