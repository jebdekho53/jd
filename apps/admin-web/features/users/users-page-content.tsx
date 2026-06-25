'use client';

import { useSearchParams } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

const ROLE_LABELS: Record<string, string> = {
  BUYER: 'Buyer',
  MERCHANT: 'Merchant',
  RIDER: 'Rider',
  ADMIN: 'Admin',
};

export function UsersPageContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role')?.toUpperCase();
  const roleLabel = role ? ROLE_LABELS[role] ?? role : 'Platform';

  return (
    <FeaturePlaceholder
      title={`${roleLabel} user directory`}
      description={
        role
          ? `Filtered to ${role} accounts — full directory UI ships in Phase 2.`
          : 'All platform users (buyers, merchants, riders) — Phase 2.'
      }
    />
  );
}
