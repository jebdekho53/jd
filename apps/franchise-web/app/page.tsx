import { MarketingShell } from '@/features/marketing/components/marketing-shell';
import { FranchiseLandingContent } from '@/features/marketing/franchise-landing-content';

export const metadata = {
  title: 'Become a JebDekho Franchise Partner',
  description:
    'Run a JebDekho franchise in your city. Recruit local merchants, own an exclusive territory, and earn on every order they take.',
};

export default function Home() {
  return (
    <MarketingShell>
      <FranchiseLandingContent />
    </MarketingShell>
  );
}
