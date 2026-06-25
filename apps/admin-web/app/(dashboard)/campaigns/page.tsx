import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { CampaignsAdminContent } from '@/features/campaigns/campaigns-admin-content';

export const metadata: Metadata = { title: 'Campaign Center' };

export default function AdminCampaignsPage() {
  return (
    <DashboardShell title="Campaign Center">
      <CampaignsAdminContent />
    </DashboardShell>
  );
}
