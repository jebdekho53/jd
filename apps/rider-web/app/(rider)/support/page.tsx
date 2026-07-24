import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CaptainChrome } from '@/features/rider/captain-chrome';
import { SupportTab } from '@/features/rider/tabs/support-tab';

export const metadata: Metadata = { title: 'Support | JebDekho Rider' };

export default function SupportPage() {
  return (
    <CaptainChrome>
      {/* SupportTab reads ?orderId= to pre-fill an order-linked ticket. */}
      <Suspense fallback={<p className="text-sm text-rider-muted">Loading support…</p>}>
        <SupportTab />
      </Suspense>
    </CaptainChrome>
  );
}
