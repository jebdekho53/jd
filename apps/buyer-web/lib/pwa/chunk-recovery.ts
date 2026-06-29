'use client';

import { clearOldPwaCaches } from './cache-cleanup';
import { PWA_STORAGE_KEYS } from './storage-keys';

const CHUNK_ERROR_PATTERNS = [
  /ChunkLoadError/i,
  /Loading chunk \d+ failed/i,
  /Loading CSS chunk \d+ failed/i,
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
];

function getErrorText(reason: unknown): string {
  if (reason instanceof Error) return `${reason.name} ${reason.message}`;
  if (typeof reason === 'string') return reason;
  if (reason && typeof reason === 'object') {
    const maybeError = reason as { name?: unknown; message?: unknown; type?: unknown };
    return [maybeError.name, maybeError.message, maybeError.type]
      .filter((value): value is string => typeof value === 'string')
      .join(' ');
  }
  return '';
}

export function isChunkLoadFailure(reason: unknown): boolean {
  const text = getErrorText(reason);
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(text));
}

export function hasChunkRecoveryRun(storage: Storage | undefined = getSessionStorage()): boolean {
  return storage?.getItem(PWA_STORAGE_KEYS.chunkRecoveryAt) != null;
}

function getSessionStorage(): Storage | undefined {
  if (typeof sessionStorage === 'undefined') return undefined;
  return sessionStorage;
}

async function unregisterServiceWorkers(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister().catch(() => false)));
}

export async function recoverFromChunkLoadFailure(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const storage = getSessionStorage();
  if (!storage || hasChunkRecoveryRun(storage)) return false;

  storage.setItem(PWA_STORAGE_KEYS.chunkRecoveryAt, String(Date.now()));
  await unregisterServiceWorkers();
  await clearOldPwaCaches(undefined, true);
  window.location.reload();
  return true;
}

export function installChunkLoadRecovery(): () => void {
  if (typeof window === 'undefined') return () => {};

  const recover = (reason: unknown) => {
    if (!isChunkLoadFailure(reason)) return;
    void recoverFromChunkLoadFailure();
  };

  const onError = (event: ErrorEvent) => recover(event.error ?? event.message);
  const onUnhandledRejection = (event: PromiseRejectionEvent) => recover(event.reason);

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);

  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
  };
}
