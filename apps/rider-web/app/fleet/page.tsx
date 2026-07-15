'use client';

import { CaptainPageShell } from '@/features/rider/captain-page-shell';
import { RiderFleetQueue } from '@/features/fleet/rider-fleet-queue';

export default function FleetPage() {
  return (
    <CaptainPageShell title="Fleet & Route" subtitle="Batch queue and optimized route.">
      <RiderFleetQueue />
    </CaptainPageShell>
  );
}
