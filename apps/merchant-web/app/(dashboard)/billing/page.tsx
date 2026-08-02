import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MerchantBillingContent } from '@/features/billing/merchant-billing-content';

export default function MerchantBillingPage() {
  return (
    <DashboardLayout title="In-Store Billing">
      <MerchantBillingContent />
    </DashboardLayout>
  );
}
