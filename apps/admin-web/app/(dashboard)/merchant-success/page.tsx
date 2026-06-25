import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { MerchantSuccessAdminContent } from '@/features/merchant-success/merchant-success-admin-content';

export const metadata: Metadata = { title: 'Merchant Success' };

export default function MerchantSuccessPage() {
  return (
    <DashboardShell title="Merchant Success">
      <MerchantSuccessAdminContent />
    </DashboardShell>
  );
}
