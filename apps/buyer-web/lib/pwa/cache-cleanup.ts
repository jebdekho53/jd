import { getAppVersion } from './app-version';

const LEGACY_RUNTIME_CACHE_NAMES = [
  'pages',
  'search-pages',
  'api-get',
  'images',
  'fonts',
  'static-assets',
  'manifest',
] as const;

export function getPwaCachePrefix(version = getAppVersion()): string {
  return `jebdekho-${version}`;
}

export function shouldDeletePwaCache(
  cacheName: string,
  currentPrefix: string,
  aggressive = false,
): boolean {
  if (LEGACY_RUNTIME_CACHE_NAMES.includes(cacheName as (typeof LEGACY_RUNTIME_CACHE_NAMES)[number])) {
    return true;
  }
  if (cacheName.startsWith('jebdekho-') && !cacheName.startsWith(currentPrefix)) {
    return true;
  }
  if (aggressive && cacheName.startsWith('workbox-precache-')) {
    return true;
  }
  return false;
}

/** Deletes stale Workbox/runtime caches. Does not touch localStorage, cookies, or IndexedDB. */
export async function clearOldPwaCaches(version = getAppVersion(), aggressive = true): Promise<string[]> {
  if (typeof caches === 'undefined') return [];
  const currentPrefix = getPwaCachePrefix(version);
  const keys = await caches.keys();
  const removed: string[] = [];

  await Promise.all(
    keys.map(async (key) => {
      if (!shouldDeletePwaCache(key, currentPrefix, aggressive)) return;
      await caches.delete(key);
      removed.push(key);
    }),
  );

  return removed;
}
