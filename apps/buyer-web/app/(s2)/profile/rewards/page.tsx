import { ProfileRewardsContent } from '@/features/profile/profile-rewards-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Loyalty rewards',
  description: 'View your loyalty points and reward history.',
  path: '/profile/rewards',
});

export default function ProfileRewardsPage() {
  return <ProfileRewardsContent />;
}
