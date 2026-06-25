import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MerchantGstContent } from '@/features/gst/merchant-gst-content';

export default function MerchantGstPage() {
  return (
    <DashboardLayout title="GST & Tax">
      <MerchantGstContent />
    </DashboardLayout>
  );
}
