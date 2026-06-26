export const PWA_THEME_COLOR = '#16a34a';
export const PWA_BACKGROUND_COLOR = '#ffffff';
export const PWA_INSTALL_DISMISS_KEY = 'jebdekho-pwa-install-dismissed';
export const PWA_CACHED_CATEGORIES_KEY = 'jebdekho-cached-categories';
export const PWA_RECENT_STORES_KEY = 'jebdekho-recent-stores';

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
] as const;

export const PRIVATE_API_PREFIXES = [
  '/api/auth',
  '/api/buyer/checkout',
  '/api/buyer/payments',
  '/api/buyer/orders',
  '/api/buyer/wallet',
  '/api/buyer/cart',
  '/api/buyer/plus',
  '/api/buyer/rewards',
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
    pathname.startsWith('/search') ||
    pathname.startsWith('/offers') ||
    pathname.startsWith('/compare') ||
    pathname.startsWith('/map') ||
    pathname.startsWith('/brand/') ||
    pathname.startsWith('/city/')
  );
}
