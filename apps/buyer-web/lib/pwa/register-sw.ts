'use client';

let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (registrationPromise) return registrationPromise;
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    registrationPromise = Promise.resolve(null);
    return registrationPromise;
  }

  registrationPromise = navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .catch(() => null);

  return registrationPromise;
}
