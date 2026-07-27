import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ExpansionAdminContent } from '@/features/expansion/expansion-admin-content';

export default function ExpansionPage() {
  return (
    <DashboardShell title="Expansion Control Tower">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Expansion Control Tower</h1>
      <ExpansionAdminContent />
    </DashboardShell>
  );
}
