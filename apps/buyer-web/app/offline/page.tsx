import type { Metadata } from 'next';
import { OfflinePageContent } from '@/features/offline/offline-page-content';

export const metadata: Metadata = {
  title: 'Offline',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return <OfflinePageContent />;
}
