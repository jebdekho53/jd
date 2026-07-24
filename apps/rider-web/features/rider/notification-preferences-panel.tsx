'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type RiderNotificationPreferences,
} from '@/lib/api';
import { Panel } from '@/design-system/primitives';

const CATEGORIES: Array<{ key: keyof RiderNotificationPreferences; label: string; hint: string }> = [
  { key: 'offerAlerts', label: 'New delivery offers', hint: 'Get notified the instant a delivery is offered to you.' },
  { key: 'walletAlerts', label: 'Payouts & earnings', hint: 'Weekly payout confirmations and COD reminders.' },
  { key: 'complianceAlerts', label: 'KYC & account status', hint: 'Document approvals, rejections, and account notices.' },
  { key: 'supportAlerts', label: 'Support replies', hint: 'Updates on your support tickets.' },
];

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      role="switch"
      aria-checked={on}
      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-40 ${
        on ? 'bg-rider-online' : 'bg-white/10'
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
          on ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

/** Previously rider-web only had a single push on/off switch — this adds the
 *  per-category control buyer-web already has via CrmPreferences, reusing the
 *  same role-agnostic NotificationPreference table on the backend. */
export function NotificationPreferencesPanel() {
  const qc = useQueryClient();
  const prefs = useQuery({ queryKey: ['rider', 'notification-preferences'], queryFn: getNotificationPreferences });
  const update = useMutation({
    mutationFn: (patch: Partial<RiderNotificationPreferences>) => updateNotificationPreferences(patch),
    onSuccess: (data) => qc.setQueryData(['rider', 'notification-preferences'], data),
  });

  return (
    <Panel title="What you're notified about">
      {prefs.isLoading ? (
        <p className="text-sm text-rider-muted">Loading…</p>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.map(({ key, label, hint }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-rider-text">{label}</p>
                <p className="text-xs text-rider-muted">{hint}</p>
              </div>
              <Toggle
                on={prefs.data?.[key] ?? true}
                disabled={update.isPending}
                onClick={() => update.mutate({ [key]: !(prefs.data?.[key] ?? true) })}
              />
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
