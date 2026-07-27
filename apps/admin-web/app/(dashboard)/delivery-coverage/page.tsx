import { DashboardShell } from '@/components/layout/dashboard-shell';
import { DeliveryCoverageAdminContent } from '@/features/delivery-coverage/delivery-coverage-admin-content';

export default function AdminDeliveryCoveragePage() {
  return (
    <DashboardShell title="Delivery Coverage">
      <DeliveryCoverageAdminContent />
    </DashboardShell>
  );
}
