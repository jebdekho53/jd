'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/**
 * Registers the service worker and shows a persistent offline strip.
 *
 * The strip matters more here than in the buyer app: a rider who does not
 * notice they have dropped off the network will keep tapping through a delivery
 * and assume it registered. It sits above everything and does not auto-dismiss.
 */
export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [offline, setOffline] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;
    void navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        if (cancelled) return;
        if (registration.waiting) setUpdateReady(true);
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        });
      })
      .catch(() => {
        /* a failed registration must never break the app shell */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const applyUpdate = () => {
    void navigator.serviceWorker.getRegistration().then((registration) => {
      registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    });
  };

  return (
    <>
      {offline && (
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-rider-danger px-4 py-2 text-xs font-bold text-white">
          <WifiOff className="h-4 w-4" />
          No connection — offers and updates are paused
        </div>
      )}
      {children}
      {updateReady && !offline && (
        <button
          onClick={applyUpdate}
          className="fixed inset-x-4 bottom-24 z-50 rounded-xl bg-rider-info px-4 py-3 text-sm font-bold text-rider-bg shadow-pop"
        >
          A new version is ready — tap to update
        </button>
      )}
    </>
  );
}
