'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineContent() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-rider-bg px-6 text-rider-text">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rider-surface">
          <WifiOff className="h-8 w-8 text-rider-muted" />
        </div>
        <h1 className="mt-5 text-2xl font-black">No connection</h1>
        <p className="mt-2 text-sm text-rider-muted">
          The app is open but cannot reach JebDekho. Your deliveries, earnings, and COD figures are
          deliberately never cached — showing you a stale one is worse than showing you nothing.
        </p>

        <div className="mt-6 rounded-2xl border border-rider-border bg-rider-surface p-4 text-left text-sm text-rider-muted">
          <p className="font-bold text-rider-text">While you are offline</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>You are not receiving new delivery offers.</li>
            <li>Your live location is not reaching operations.</li>
            <li>Deliveries you complete now cannot be confirmed until you reconnect.</li>
          </ul>
          <p className="mt-3">
            If you are mid-delivery, complete the handover as normal and mark it in the app once you
            have signal again.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="mt-6 h-12 w-full rounded-xl bg-rider-accent font-bold text-rider-accent-foreground"
        >
          {online ? 'Back online — reload' : 'Try again'}
        </button>
        {online && (
          <p className="mt-2 text-xs text-rider-online">Connection is back. Reload to continue.</p>
        )}
      </div>
    </main>
  );
}
