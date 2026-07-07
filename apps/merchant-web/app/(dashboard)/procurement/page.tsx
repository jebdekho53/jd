import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MerchantProcurementContent } from '@/features/procurement/merchant-procurement-content';

export default function ProcurementPage() {
  return (
    <DashboardLayout title="Procurement Marketplace">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Procurement Marketplace</h1>
      <MerchantProcurementContent />
    </DashboardLayout>
  );
}
