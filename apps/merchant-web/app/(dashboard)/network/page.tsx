import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MerchantNetworkContent } from '@/features/network/merchant-network-content';

export default function NetworkPage() {
  return (
    <DashboardLayout title="Fulfillment Network">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Fulfillment Network</h1>
      <MerchantNetworkContent />
    </DashboardLayout>
  );
}
