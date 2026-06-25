import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { CrmAdminContent } from '@/features/crm/crm-admin-content';

export const metadata: Metadata = { title: 'CRM & Growth' };

export default function CrmPage() {
  return (
    <DashboardShell title="CRM & Marketing Automation">
      <CrmAdminContent />
    </DashboardShell>
  );
}
