import { SupplyChainAdminContent } from '@/features/supply-chain/supply-chain-admin-content';

export default function SupplyChainPage() {
  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Supply Chain Center</h1>
      <SupplyChainAdminContent />
    </div>
  );
}
