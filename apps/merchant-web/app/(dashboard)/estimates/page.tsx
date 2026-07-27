import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MerchantEstimatesContent } from '@/features/estimates/merchant-estimates-content';

export default function MerchantEstimatesPage() {
  return (
    <DashboardLayout title="Estimates & Quotations">
      <MerchantEstimatesContent />
    </DashboardLayout>
  );
}
