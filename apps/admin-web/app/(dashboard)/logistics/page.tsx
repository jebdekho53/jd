import { DashboardShell } from '@/components/layout/dashboard-shell';
import { LogisticsDashboardContent } from '@/features/logistics/logistics-dashboard-content';

export default function LogisticsPage() {
  return (
    <DashboardShell title="Logistics">
      <LogisticsDashboardContent />
    </DashboardShell>
  );
}
