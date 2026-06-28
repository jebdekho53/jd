import { getAppVersion } from './app-version';

/** Approximate cache budgets (Serwist ExpirationPlugin uses entry counts). */
export const CACHE_LIMITS = {
  images: { maxEntries: 400, maxAgeSeconds: 30 * 24 * 60 * 60 },
  static: { maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60 },
  fonts: { maxEntries: 24, maxAgeSeconds: 365 * 24 * 60 * 60 },
  api: { maxEntries: 80, maxAgeSeconds: 24 * 60 * 60 },
  pages: { maxEntries: 64, maxAgeSeconds: 7 * 24 * 60 * 60 },
  search: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
} as const;

export function runtimeCacheName(suffix: string, version = getAppVersion()): string {
  return `jebdekho-${version}-${suffix}`;
}
