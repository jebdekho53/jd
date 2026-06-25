import { MerchantNetworkContent } from '@/features/network/merchant-network-content';

export default function NetworkPage() {
  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Fulfillment Network</h1>
      <MerchantNetworkContent />
    </div>
  );
}
