import { DashboardShell } from '@/components/layout/dashboard-shell';
import { TrustSafetyAdminContent } from '@/features/trust-safety/trust-safety-admin-content';

export default function TrustSafetyPage() {
  return (
    <DashboardShell title="Trust & Safety">
      <TrustSafetyAdminContent />
    </DashboardShell>
  );
}
