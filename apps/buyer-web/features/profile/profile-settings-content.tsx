'use client';

import { ProfileShell } from '@/features/profile/components/profile-shell';
import { NotificationToggle } from '@/features/profile/components/notification-toggle';
import { ProfileListSkeleton } from '@/features/profile/components/profile-skeleton';
import { ProfileErrorState } from '@/features/profile/components/profile-error';
import {
  useSettingsQuery,
  useUpdateSettingsMutation,
  useNotificationPreferencesQuery,
  useUpdateNotificationMutation,
} from '@/features/profile/hooks/use-preferences';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ta', label: 'Tamil' },
];

const LOCATIONS = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'manual', label: 'Manual selection' },
];

export function ProfileSettingsContent() {
  const { data: settings, isLoading, isError, refetch } = useSettingsQuery();
  const { data: notifs } = useNotificationPreferencesQuery();
  const updateSettings = useUpdateSettingsMutation();
  const updateNotif = useUpdateNotificationMutation();

  if (isLoading) {
    return (
      <ProfileShell title="Settings">
        <ProfileListSkeleton rows={4} />
      </ProfileShell>
    );
  }

  if (isError || !settings) {
    return (
      <ProfileShell title="Settings">
        <ProfileErrorState onRetry={() => refetch()} />
      </ProfileShell>
    );
  }

  const allNotifsOn = notifs
    ? notifs.orders && notifs.offers && notifs.delivery && notifs.account
    : true;

  return (
    <ProfileShell title="Settings" subtitle="App preferences">
      <div className="space-y-6">
        <section aria-labelledby="appearance-heading">
          <h2 id="appearance-heading" className="mb-3 text-xs font-semibold uppercase tracking-wider text-jd-text-muted">
            Appearance
          </h2>
          <NotificationToggle
            id="dark-mode"
            label="Dark mode"
            description="Easier on the eyes at night"
            checked={settings.darkMode}
            onChange={(darkMode) => updateSettings.mutate({ darkMode })}
          />
        </section>

        <section aria-labelledby="language-heading">
          <h2 id="language-heading" className="mb-3 text-xs font-semibold uppercase tracking-wider text-jd-text-muted">
            Language
          </h2>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                type="button"
                onClick={() => updateSettings.mutate({ language: lang.value })}
                className={cn(
                  'rounded-xl border px-4 py-2 text-sm font-medium transition',
                  settings.language === lang.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 text-jd-text-secondary hover:bg-cream-3',
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="location-heading">
          <h2 id="location-heading" className="mb-3 text-xs font-semibold uppercase tracking-wider text-jd-text-muted">
            Location preference
          </h2>
          <div className="flex flex-wrap gap-2">
            {LOCATIONS.map((loc) => (
              <button
                key={loc.value}
                type="button"
                onClick={() => updateSettings.mutate({ locationPreference: loc.value })}
                className={cn(
                  'rounded-xl border px-4 py-2 text-sm font-medium transition',
                  settings.locationPreference === loc.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 text-jd-text-secondary hover:bg-cream-3',
                )}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="notif-heading">
          <h2 id="notif-heading" className="mb-3 text-xs font-semibold uppercase tracking-wider text-jd-text-muted">
            Notifications
          </h2>
          <NotificationToggle
            id="all-notifications"
            label="All notifications"
            description="Master toggle for push and SMS alerts"
            checked={allNotifsOn}
            onChange={(on) => {
              (['orders', 'offers', 'delivery', 'account'] as const).forEach((key) =>
                updateNotif.mutate({ key, value: on }),
              );
            }}
          />
        </section>

        <section aria-labelledby="about-heading">
          <h2 id="about-heading" className="mb-3 text-xs font-semibold uppercase tracking-wider text-jd-text-muted">
            About
          </h2>
          <p className="text-sm text-jd-text-secondary">
            App version{' '}
            <span className="font-mono text-jd-text-primary">
              {process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0'}
            </span>
          </p>
        </section>
      </div>
    </ProfileShell>
  );
}
