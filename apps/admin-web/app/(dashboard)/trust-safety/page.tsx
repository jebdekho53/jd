import { TrustSafetyAdminContent } from '@/features/trust-safety/trust-safety-admin-content';

export default function TrustSafetyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trust & Safety</h1>
        <p className="text-sm text-muted-foreground">Fraud detection, risk profiles & automated enforcement</p>
      </div>
      <TrustSafetyAdminContent />
    </div>
  );
}
