import type { Metadata } from 'next';
import { CaptainChrome } from '@/features/rider/captain-chrome';
import { AccountTab } from '@/features/rider/tabs/account-tab';

export const metadata: Metadata = { title: 'Account | JebDekho Rider' };

export default function AccountPage() {
  return (
    <CaptainChrome>
      <AccountTab />
    </CaptainChrome>
  );
}
