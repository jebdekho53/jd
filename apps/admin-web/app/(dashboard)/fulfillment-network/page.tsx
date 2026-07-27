import { DashboardShell } from '@/components/layout/dashboard-shell';
import { FulfillmentNetworkAdminContent } from '@/features/fulfillment-network/fulfillment-network-admin-content';

export default function FulfillmentNetworkPage() {
  return (
    <DashboardShell title="Fulfillment Network">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Fulfillment Network</h1>
      <FulfillmentNetworkAdminContent />
    </DashboardShell>
  );
}
