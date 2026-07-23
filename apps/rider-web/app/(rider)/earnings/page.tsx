import type { Metadata } from 'next';
import { CaptainChrome } from '@/features/rider/captain-chrome';
import { EarningsTab } from '@/features/rider/tabs/earnings-tab';

export const metadata: Metadata = { title: 'Earnings | JebDekho Rider' };

export default function EarningsPage() {
  return (
    <CaptainChrome>
      <EarningsTab />
    </CaptainChrome>
  );
}
