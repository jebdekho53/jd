import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SupplyChainAdminContent } from '@/features/supply-chain/supply-chain-admin-content';

export default function SupplyChainPage() {
  return (
    <DashboardShell title="Supply Chain Center">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Supply Chain Center</h1>
      <SupplyChainAdminContent />
    </DashboardShell>
  );
}
