import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export const metadata: Metadata = { title: 'Monitoring' };

export default function MonitoringPage() {
  return (
    <DashboardShell title="System Monitoring">
      <FeaturePlaceholder
        title="Fraud & system alerts"
        description="Failed payments, OTP abuse, order spikes, inventory mismatches — Phase 2."
      />
    </DashboardShell>
  );
}
