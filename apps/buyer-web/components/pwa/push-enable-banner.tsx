'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/use-push-notifications';

interface PushEnableBannerProps {
  title?: string;
  description?: string;
}

export function PushEnableBanner({
  title = 'Get live order updates',
  description = 'Enable push notifications to track delivery, offers, and wallet alerts.',
}: PushEnableBannerProps) {
  const { status, loading, supported, enable } = usePushNotifications();

  if (!supported || status === 'enabled' || status === 'blocked') return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Bell className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold text-jd-text-primary">{title}</p>
          <p className="text-xs text-jd-text-muted">{description}</p>
        </div>
      </div>
      <Button type="button" size="sm" className="shrink-0" disabled={loading} onClick={() => void enable()}>
        Enable notifications
      </Button>
    </div>
  );
}
