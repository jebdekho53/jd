export const PWA_THEME_COLOR = '#16a34a';
export const PWA_BACKGROUND_COLOR = '#ffffff';
export const PWA_CACHED_CATEGORIES_KEY = 'jebdekho-cached-categories';
export const PWA_RECENT_STORES_KEY = 'jebdekho-recent-stores';

export { PWA_STORAGE_KEYS, PWA_INSTALL_DISMISS_KEY_LEGACY as PWA_INSTALL_DISMISS_KEY } from './storage-keys';

export const PRIVATE_DOCUMENT_PREFIXES = [
  '/checkout',
  '/cart',
  '/login',
  '/signup',
  '/forgot-password',
  '/onboarding',
  '/orders',
  '/wallet',
  '/corporate',
  '/profile',
  '/plus',
] as const;

/** BFF + backend paths that must never be cached by the service worker. */
export const PRIVATE_API_PREFIXES = [
  '/api/auth',
  '/api/buyer',
  '/api/corporate',
] as const;

export function isPrivateDocumentPath(pathname: string): boolean {
  return PRIVATE_DOCUMENT_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function isPrivateApiPath(pathname: string): boolean {
  return PRIVATE_API_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function isPublicBrowsePath(pathname: string): boolean {
  if (isPrivateDocumentPath(pathname)) return false;
  if (pathname.startsWith('/offline')) return true;
  return (
    pathname === '/' ||
    pathname.startsWith('/categories') ||
    pathname.startsWith('/category/') ||
    pathname.startsWith('/products') ||
    pathname.startsWith('/store/') ||
    pathname.startsWith('/stores') ||
    pathname.startsWith('/offers') ||
    pathname.startsWith('/compare') ||
    pathname.startsWith('/map') ||
    pathname.startsWith('/brand/') ||
    pathname.startsWith('/city/')
  );
}
