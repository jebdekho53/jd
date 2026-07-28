import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ZonesAdminContent } from '@/features/zones/zones-admin-content';

export default function AdminZonesPage() {
  return (
    <DashboardShell title="Delivery Zones">
      <ZonesAdminContent />
    </DashboardShell>
  );
}
