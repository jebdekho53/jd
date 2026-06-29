'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createBrowserPushSubscription,
  fetchPushStatus,
  removePushSubscription,
  savePushSubscription,
} from '@/lib/pwa/push/push-client';
import {
  type PushPermissionState,
  resolveClientPushState,
} from '@/lib/pwa/push/push-utils';
import { PwaNotificationService } from '@/lib/pwa/notifications/notification-service';
import { registerServiceWorker } from '@/lib/pwa/register-sw';
import { useAuthStore } from '@/store/auth-store';

export function usePushNotifications() {
  const [status, setStatus] = useState<PushPermissionState>('not_enabled');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.loading);

  const refresh = useCallback(async () => {
    if (authLoading) return;

    setLoading(true);
    setError(null);
    try {
      const pushSupported =
        typeof window !== 'undefined' &&
        'Notification' in window &&
        'serviceWorker' in navigator &&
        'PushManager' in window;
      setSupported(pushSupported);
      if (!pushSupported) {
        setStatus('not_enabled');
        return;
      }

      const permission = await PwaNotificationService.permission();
      if (!isAuthenticated) {
        setStatus(resolveClientPushState(permission, false));
        return;
      }

      const apiStatus = await fetchPushStatus();
      setStatus(resolveClientPushState(permission, apiStatus.subscribed));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (process.env.NODE_ENV === 'production') {
        await registerServiceWorker();
      }
      const permission = await PwaNotificationService.requestPermission();
      if (permission !== 'granted') {
        setStatus('blocked');
        return;
      }
      const apiStatus = await fetchPushStatus();
      if (!apiStatus.publicKey) throw new Error('Push is not configured on the server');
      const subscription = await createBrowserPushSubscription(apiStatus.publicKey);
      await savePushSubscription(subscription);
      setStatus('enabled');
    } catch (e) {
      setError((e as Error).message);
      await refresh();
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const disable = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker?.ready;
      const sub = await registration?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus(resolveClientPushState(Notification.permission, false));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { status, loading, error, supported, enable, disable, refresh };
}
