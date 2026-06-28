'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export function PushAfterInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const { status, supported, enable, loading } = usePushNotifications();

  useEffect(() => {
    const onInstalled = () => setVisible(true);
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  if (!visible || !supported || status === 'enabled' || status === 'blocked') return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-[95] w-[min(100%,22rem)] -translate-x-1/2 rounded-2xl border border-border bg-card p-4 shadow-xl md:bottom-6">
      <div className="flex items-start gap-3">
        <Bell className="h-5 w-5 text-primary" />
        <div className="space-y-2">
          <p className="text-sm font-semibold">JebDekho installed</p>
          <p className="text-xs text-jd-text-muted">Turn on notifications for order and delivery updates.</p>
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={loading} onClick={() => void enable().then(() => setVisible(false))}>
              Enable
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setVisible(false)}>
              Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
