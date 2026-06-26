import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { MasterLocationsContent } from '@/features/locations/master-locations-content';

export const metadata: Metadata = { title: 'Master Locations' };

export default function MasterLocationsPage() {
  return (
    <DashboardShell title="Master Locations">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <MasterLocationsContent />
      </Suspense>
    </DashboardShell>
  );
}
