import type { PrecacheEntry } from 'serwist';

export function getPrecacheUrl(entry: PrecacheEntry | string): string {
  return typeof entry === 'string' ? entry : entry.url;
}

export function isVolatileNextAsset(pathname: string): boolean {
  return pathname.startsWith('/_next/static/');
}

export function getSafePrecacheEntries(
  entries: (PrecacheEntry | string)[] | undefined,
  origin = 'https://jebdekho.com',
): (PrecacheEntry | string)[] {
  return (entries ?? []).filter((entry) => {
    try {
      const url = new URL(getPrecacheUrl(entry), origin);
      return !isVolatileNextAsset(url.pathname);
    } catch {
      return false;
    }
  });
}
