import {
  detectPushDeviceType,
  urlBase64ToUint8Array,
  type PushStatusResponse,
} from './push-utils';

export interface PushSubscriptionPayload {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  deviceType?: 'ANDROID' | 'IOS' | 'DESKTOP' | 'UNKNOWN';
}

async function parseJson<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Push request failed');
  return json.data as T;
}

export async function fetchPushStatus(): Promise<PushStatusResponse> {
  const res = await fetch('/api/buyer/notifications/push/status', {
    credentials: 'include',
  });
  return parseJson<PushStatusResponse>(res);
}

export async function savePushSubscription(payload: PushSubscriptionPayload): Promise<void> {
  const res = await fetch('/api/buyer/notifications/push/subscribe', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await parseJson(res);
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const res = await fetch('/api/buyer/notifications/push/unsubscribe', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  });
  await parseJson(res);
}

export async function createBrowserPushSubscription(publicKey: string): Promise<PushSubscriptionPayload> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported in this browser');
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    }));

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Invalid push subscription');
  }

  return {
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    userAgent: navigator.userAgent,
    deviceType: detectPushDeviceType(),
  };
}
