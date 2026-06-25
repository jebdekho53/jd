import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SupportCenterContent } from '@/features/support/support-center-content';

export const metadata: Metadata = { title: 'Support Center' };

export default function SupportCenterPage() {
  return (
    <DashboardShell title="Support Center">
      <SupportCenterContent />
    </DashboardShell>
  );
}
