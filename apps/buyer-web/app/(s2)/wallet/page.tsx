import { WalletPageContent } from '@/features/wallet/wallet-page-content';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Wallet — JebDekho' };

export default function WalletPage() {
  return <WalletPageContent />;
}
