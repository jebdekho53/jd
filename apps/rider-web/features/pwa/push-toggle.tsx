'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing } from 'lucide-react';
import { getPushStatus, subscribeToPush, unsubscribeFromPush } from '@/lib/api';
import { Button, Panel } from '@/design-system/primitives';

/**
 * VAPID keys travel as base64url; PushManager wants raw bytes.
 *
 * The buffer is allocated explicitly rather than via `Uint8Array.from` so the
 * result is typed as ArrayBuffer-backed — `applicationServerKey` rejects the
 * `ArrayBufferLike` that the generic form widens to.
 */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function keyToBase64(key: ArrayBuffer | null): string {
  if (!key) return '';
  return btoa(String.fromCharCode(...new Uint8Array(key)));
}

export function PushToggle() {
  const qc = useQueryClient();
  const status = useQuery({ queryKey: ['rider', 'push', 'status'], queryFn: getPushStatus });
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const enable = useMutation({
    mutationFn: async () => {
      const publicKey = status.data?.publicKey;
      if (!publicKey) throw new Error('Push is not configured on the server yet.');

      const granted = await Notification.requestPermission();
      setPermission(granted);
      if (granted !== 'granted') throw new Error('Notification permission was not granted.');

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const json = subscription.toJSON();
      return subscribeToPush({
        endpoint: subscription.endpoint,
        p256dh: json.keys?.p256dh ?? keyToBase64(subscription.getKey('p256dh')),
        auth: json.keys?.auth ?? keyToBase64(subscription.getKey('auth')),
        userAgent: navigator.userAgent,
      });
    },
    onSuccess: () => {
      setError(null);
      qc.invalidateQueries({ queryKey: ['rider', 'push', 'status'] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not enable notifications'),
  });

  const disable = useMutation({
    mutationFn: async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return { updated: 0 };
      const { endpoint } = subscription;
      await subscription.unsubscribe();
      return unsubscribeFromPush(endpoint);
    },
    onSuccess: () => {
      setError(null);
      qc.invalidateQueries({ queryKey: ['rider', 'push', 'status'] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not turn notifications off'),
  });

  const subscribed = Boolean(status.data?.subscribed);

  return (
    <Panel title="Delivery offer alerts">
      <div className="flex items-start gap-3">
        <BellRing className={`mt-0.5 h-5 w-5 shrink-0 ${subscribed ? 'text-rider-online' : 'text-rider-muted'}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-rider-muted">
            Without this, delivery offers only reach you while the app is open on screen. Offers
            expire on a timer, so turn it on before your first shift.
          </p>

          {permission === 'unsupported' ? (
            <p className="mt-3 text-sm text-rider-danger">
              This browser cannot receive push notifications. Install the app to your home screen, or
              use Chrome on Android.
            </p>
          ) : status.isLoading ? (
            <p className="mt-3 text-sm text-rider-muted">Checking…</p>
          ) : status.isError ? (
            <p className="mt-3 text-sm text-rider-danger">Could not check notification status.</p>
          ) : !status.data?.configured ? (
            <p className="mt-3 text-sm text-rider-danger">
              Push is not configured on the server yet. Contact support if offers are not reaching
              you.
            </p>
          ) : permission === 'denied' ? (
            <p className="mt-3 text-sm text-rider-danger">
              Notifications are blocked for this site. Enable them in your browser settings for
              JebDekho, then reload.
            </p>
          ) : subscribed ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-bold text-rider-online">
                On — offers will reach you even with the app closed.
              </p>
              <Button variant="outline" onClick={() => disable.mutate()} disabled={disable.isPending}>
                {disable.isPending ? 'Turning off…' : 'Turn off on this device'}
              </Button>
            </div>
          ) : (
            <div className="mt-3">
              <Button onClick={() => enable.mutate()} disabled={enable.isPending}>
                {enable.isPending ? 'Enabling…' : 'Turn on offer alerts'}
              </Button>
            </div>
          )}

          {error && <p className="mt-2 text-sm text-rider-danger">{error}</p>}
        </div>
      </div>
    </Panel>
  );
}
