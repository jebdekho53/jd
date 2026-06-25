import { ProfileReferralsContent } from '@/features/profile/profile-referrals-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Refer & earn',
  description: 'Invite friends and earn rewards on JebDekho.',
  path: '/profile/referrals',
});

export default function ProfileReferralsPage() {
  return <ProfileReferralsContent />;
}
