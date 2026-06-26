'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { applyServiceWorkerUpdate, onServiceWorkerUpdate } from '@/lib/pwa/register-sw';
import { Button } from '@/components/ui/button';

export function UpdateToast() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    return onServiceWorkerUpdate(() => setShow(true));
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed bottom-20 left-1/2 z-[110] w-[min(100%,24rem)] -translate-x-1/2 rounded-2xl border border-border bg-card p-4 shadow-xl md:bottom-6"
      role="status"
    >
      <p className="text-sm font-semibold text-jd-text-primary">New version available</p>
      <p className="mt-1 text-xs text-jd-text-muted">Update JebDekho for the latest fixes and features.</p>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            void applyServiceWorkerUpdate();
            window.location.reload();
          }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Update
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setShow(false)}>
          Later
        </Button>
      </div>
    </div>
  );
}
