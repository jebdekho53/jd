import type { PwaNotificationPayload } from './types';

/**
 * Client-side notification facade. Swap `deliver` for FCM when backend is ready.
 */
export class PwaNotificationService {
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  static async permission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    return Notification.requestPermission();
  }

  /** Show a local notification (dev / permission-granted preview). */
  static async showLocal(payload: PwaNotificationPayload): Promise<void> {
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg?.showNotification) {
      await reg.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon ?? '/pwa/icons/icon-192.png',
        badge: payload.badge ?? '/pwa/icons/icon-72.png',
        tag: payload.tag ?? payload.type,
        data: { url: payload.url ?? '/', ...payload.data },
      });
      return;
    }

    new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon ?? '/pwa/icons/icon-192.png',
      tag: payload.tag,
    });
  }

  /** Reserved for FCM token registration. */
  static async registerDevice(): Promise<string | null> {
    return null;
  }
}
