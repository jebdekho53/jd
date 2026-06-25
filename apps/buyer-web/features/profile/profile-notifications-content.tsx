'use client';

import { ProfileShell } from '@/features/profile/components/profile-shell';
import { NotificationToggle } from '@/features/profile/components/notification-toggle';
import { ProfileListSkeleton } from '@/features/profile/components/profile-skeleton';
import { ProfileErrorState } from '@/features/profile/components/profile-error';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCrmPreferences, updateCrmPreferences } from '@/services/crm/crm-api';

const CHANNEL_PREFS = [
  { key: 'pushEnabled' as const, label: 'Push notifications', description: 'Alerts on your device' },
  { key: 'emailEnabled' as const, label: 'Email', description: 'Updates to your inbox' },
  { key: 'smsEnabled' as const, label: 'SMS', description: 'Text message alerts' },
  { key: 'whatsappEnabled' as const, label: 'WhatsApp', description: 'Messages on WhatsApp' },
];

const CATEGORY_PREFS = [
  { key: 'marketingConsent' as const, label: 'Marketing', description: 'Offers, deals and promotions' },
  { key: 'orderUpdates' as const, label: 'Order updates', description: 'Confirmations and delivery status' },
  { key: 'walletAlerts' as const, label: 'Wallet', description: 'Credits, debits and balance' },
  { key: 'offerAlerts' as const, label: 'Offers', description: 'Personalized deals' },
  { key: 'referralAlerts' as const, label: 'Referrals', description: 'Referral rewards and invites' },
  { key: 'supportAlerts' as const, label: 'Support', description: 'Ticket updates' },
  { key: 'complianceAlerts' as const, label: 'Compliance', description: 'Important account notices' },
];

export function ProfileNotificationsContent() {
  const qc = useQueryClient();
  const { data: prefs, isLoading, isError, refetch } = useQuery({
    queryKey: ['crm', 'preferences'],
    queryFn: fetchCrmPreferences,
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: (patch: Partial<typeof prefs>) => updateCrmPreferences(patch as never),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'preferences'] }),
  });

  if (isLoading) {
    return (
      <ProfileShell title="Notifications">
        <ProfileListSkeleton rows={6} />
      </ProfileShell>
    );
  }

  if (isError || !prefs) {
    return (
      <ProfileShell title="Notifications">
        <ProfileErrorState onRetry={() => refetch()} />
      </ProfileShell>
    );
  }

  return (
    <ProfileShell title="Notifications" subtitle="Control channels and alert types">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-jd-text-muted">Channels</h2>
      <div className="mb-6 space-y-3">
        {CHANNEL_PREFS.map((cat) => (
          <NotificationToggle
            key={cat.key}
            id={`ch-${cat.key}`}
            label={cat.label}
            description={cat.description}
            checked={prefs[cat.key]}
            disabled={updateMutation.isPending}
            onChange={(value) => updateMutation.mutate({ [cat.key]: value })}
          />
        ))}
      </div>

      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-jd-text-muted">Alert types</h2>
      <div className="space-y-3">
        {CATEGORY_PREFS.map((cat) => (
          <NotificationToggle
            key={cat.key}
            id={`cat-${cat.key}`}
            label={cat.label}
            description={cat.description}
            checked={prefs[cat.key]}
            disabled={updateMutation.isPending}
            onChange={(value) => updateMutation.mutate({ [cat.key]: value })}
          />
        ))}
      </div>
    </ProfileShell>
  );
}
