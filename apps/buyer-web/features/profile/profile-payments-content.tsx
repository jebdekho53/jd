'use client';

import { ProfileShell } from '@/features/profile/components/profile-shell';
import { PaymentMethodCard } from '@/features/profile/components/payment-method-card';
import { ProfileListSkeleton } from '@/features/profile/components/profile-skeleton';
import { ProfileErrorState } from '@/features/profile/components/profile-error';
import { usePaymentMethodsQuery } from '@/features/profile/hooks/use-preferences';

export function ProfilePaymentsContent() {
  const { data: methods, isLoading, isError, refetch } = usePaymentMethodsQuery();

  if (isLoading) {
    return (
      <ProfileShell title="Payment methods">
        <ProfileListSkeleton rows={3} />
      </ProfileShell>
    );
  }

  if (isError) {
    return (
      <ProfileShell title="Payment methods">
        <ProfileErrorState onRetry={() => refetch()} />
      </ProfileShell>
    );
  }

  return (
    <ProfileShell
      title="Payment methods"
      subtitle="Secure payments — gateway integration coming soon"
    >
      <p className="mb-4 rounded-xl bg-cream-3 px-4 py-3 text-sm text-jd-text-muted">
        Save UPI, cards, or net banking for one-tap checkout. Payment gateway will be enabled in a future update.
      </p>
      <ul className="space-y-3">
        {methods?.map((m) => (
          <li key={m.id}>
            <PaymentMethodCard method={m} />
          </li>
        ))}
      </ul>
    </ProfileShell>
  );
}
