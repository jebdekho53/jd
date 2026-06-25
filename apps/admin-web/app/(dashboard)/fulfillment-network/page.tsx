import { FulfillmentNetworkAdminContent } from '@/features/fulfillment-network/fulfillment-network-admin-content';

export default function FulfillmentNetworkPage() {
  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Fulfillment Network</h1>
      <FulfillmentNetworkAdminContent />
    </div>
  );
}
