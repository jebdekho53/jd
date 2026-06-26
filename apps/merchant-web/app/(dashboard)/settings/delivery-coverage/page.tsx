import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { DeliveryCoverageContent } from '@/features/delivery-coverage/delivery-coverage-content';

export default function DeliveryCoveragePage() {
  return (
    <DashboardLayout title="Delivery Coverage">
      <DeliveryCoverageContent />
    </DashboardLayout>
  );
}
