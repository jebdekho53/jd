import type { Metadata } from 'next';
import { OfflineContent } from '@/features/pwa/offline-content';

export const metadata: Metadata = {
  title: 'Offline | JebDekho Rider',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return <OfflineContent />;
}
