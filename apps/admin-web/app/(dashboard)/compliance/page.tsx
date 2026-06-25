import { ComplianceAdminContent } from '@/features/compliance/compliance-admin-content';

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance Center</h1>
        <p className="text-sm text-muted-foreground">GST invoicing, tax automation & audit registers</p>
      </div>
      <ComplianceAdminContent />
    </div>
  );
}
