import type { Metadata } from 'next';
import { CaptainChrome } from '@/features/rider/captain-chrome';
import { HomeTab } from '@/features/rider/tabs/home-tab';

export const metadata: Metadata = { title: 'Home | JebDekho Rider' };

export default function HomePage() {
  return (
    <CaptainChrome>
      <HomeTab />
    </CaptainChrome>
  );
}
