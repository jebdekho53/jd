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

export async function applyServiceWorkerUpdate(): Promise<void> {
  const reg = await registerServiceWorker();
  reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
}

export function onServiceWorkerUpdate(callback: () => void): () => void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return () => {};
  }

  const onControllerChange = () => callback();
  navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

  const check = async () => {
    const reg = await registerServiceWorker();
    if (!reg) return;

    if (reg.waiting) callback();

    reg.addEventListener('updatefound', () => {
      const installing = reg.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          callback();
        }
      });
    });
  };

  void check();

  return () => {
    navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
  };
}
