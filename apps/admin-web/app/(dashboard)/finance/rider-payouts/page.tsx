import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RiderPayoutsContent } from '@/features/finance/rider-payouts-content';

export const metadata: Metadata = { title: 'Rider Payouts' };

export default function RiderPayoutsPage() {
  return (
    <DashboardShell title="Rider Payouts">
      <RiderPayoutsContent />
    </DashboardShell>
  );
}
