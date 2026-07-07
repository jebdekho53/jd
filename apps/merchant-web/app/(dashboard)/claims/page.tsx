import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MerchantClaimsPageContent } from '@/features/claims/merchant-claims-page-content';

export default function ClaimsPage() {
  return (
    <DashboardLayout title="Returns & Claims">
      <MerchantClaimsPageContent />
    </DashboardLayout>
  );
}
