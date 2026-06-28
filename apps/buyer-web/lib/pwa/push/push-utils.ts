export type PushPermissionState = 'enabled' | 'blocked' | 'not_enabled';

export interface PushStatusResponse {
  configured: boolean;
  publicKey: string | null;
  subscribed: boolean;
  activeSubscriptions: number;
}

export function resolveClientPushState(
  permission: NotificationPermission,
  subscribed: boolean,
): PushPermissionState {
  if (permission === 'denied') return 'blocked';
  if (permission === 'granted' && subscribed) return 'enabled';
  return 'not_enabled';
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function detectPushDeviceType(): 'ANDROID' | 'IOS' | 'DESKTOP' | 'UNKNOWN' {
  if (typeof navigator === 'undefined') return 'UNKNOWN';
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'ANDROID';
  if (/iphone|ipad|ipod/i.test(ua)) return 'IOS';
  if (/windows|macintosh|linux/i.test(ua)) return 'DESKTOP';
  return 'UNKNOWN';
}
