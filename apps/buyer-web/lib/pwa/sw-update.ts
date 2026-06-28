import { clearOldPwaCaches } from './cache-cleanup';
import { PWA_STORAGE_KEYS } from './storage-keys';
import { registerServiceWorker } from './register-sw';

export { clearOldPwaCaches, getPwaCachePrefix, shouldDeletePwaCache } from './cache-cleanup';

export function clearUpdatePendingFlag(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(PWA_STORAGE_KEYS.updatePending);
}

export function isUpdateReloadPending(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(PWA_STORAGE_KEYS.updatePending) === '1';
}

export async function hasWaitingServiceWorker(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
  const reg = await registerServiceWorker();
  return Boolean(reg?.waiting);
}

export async function applyPwaUpdate(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (isUpdateReloadPending()) return;

  const reg = await navigator.serviceWorker.ready;
  const waiting = reg.waiting;
  if (!waiting) return;

  sessionStorage.setItem(PWA_STORAGE_KEYS.updatePending, '1');

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      reject(new Error('Service worker update timed out'));
    }, 15_000);

    const onControllerChange = () => {
      window.clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      resolve();
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    waiting.postMessage({ type: 'SKIP_WAITING' });
  });

  await clearOldPwaCaches();
  window.location.reload();
}
