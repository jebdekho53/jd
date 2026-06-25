import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { MerchantApplicationsContent } from '@/features/merchant-applications/merchant-applications-content';

export const metadata: Metadata = { title: 'Merchant Applications' };

export default function MerchantApplicationsPage() {
  return (
    <DashboardShell title="Merchant Applications">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <MerchantApplicationsContent />
      </Suspense>
    </DashboardShell>
  );
}
