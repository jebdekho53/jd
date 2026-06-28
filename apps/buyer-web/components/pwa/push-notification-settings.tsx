'use client';

import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/use-push-notifications';

const STATUS_LABELS = {
  enabled: 'Enabled',
  blocked: 'Blocked',
  not_enabled: 'Not enabled',
} as const;

interface PushNotificationSettingsProps {
  compact?: boolean;
}

export function PushNotificationSettings({ compact = false }: PushNotificationSettingsProps) {
  const { status, loading, error, supported, enable, disable } = usePushNotifications();

  if (!supported) {
    return (
      <p className="text-sm text-jd-text-muted">
        Push notifications are not supported in this browser.
      </p>
    );
  }

  return (
    <div className={compact ? 'space-y-2' : 'rounded-2xl border border-border/60 bg-card p-4 space-y-3'}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-jd-text-primary">Device push alerts</p>
          <p className="text-xs text-jd-text-muted">
            Status: <span className="font-medium">{STATUS_LABELS[status]}</span>
          </p>
          {status === 'blocked' && (
            <p className="mt-1 text-xs text-amber-700">
              Notifications are blocked in browser settings. Enable them for JebDekho to receive alerts.
            </p>
          )}
        </div>
        {status === 'enabled' ? (
          <Bell className="h-5 w-5 text-primary" aria-hidden />
        ) : (
          <BellOff className="h-5 w-5 text-jd-text-muted" aria-hidden />
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {status !== 'enabled' && status !== 'blocked' && (
          <Button type="button" size="sm" disabled={loading} onClick={() => void enable()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enable push'}
          </Button>
        )}
        {status === 'enabled' && (
          <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => void disable()}>
            Turn off push
          </Button>
        )}
      </div>
    </div>
  );
}
