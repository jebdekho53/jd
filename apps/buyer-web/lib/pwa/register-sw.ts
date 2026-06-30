'use client';

let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (registrationPromise) return registrationPromise;
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    registrationPromise = Promise.resolve(null);
    return registrationPromise;
  }
  if (
    window.localStorage.getItem('jebdekho-e2e-disable-sw') === '1' ||
    new URLSearchParams(window.location.search).get('e2eDisableSw') === '1'
  ) {
    registrationPromise = navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister())),
      )
      .then(() => null)
      .catch(() => null);
    return registrationPromise;
  }

  registrationPromise = navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .catch(() => null);

  return registrationPromise;
}
