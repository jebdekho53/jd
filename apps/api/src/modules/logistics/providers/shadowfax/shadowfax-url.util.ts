import type { ShadowfaxApiMode } from './shadowfax.endpoints';

/**
 * Shadowfax hyperlocal (Flash) hosts use /order/create/.
 * Unified V3 hosts use /api as the API base and mode-specific /v3 paths.
 */
export function resolveShadowfaxApiMode(
  apiUrl: string,
  explicitMode?: string | null,
): ShadowfaxApiMode {
  const mode = (explicitMode ?? '').trim().toLowerCase();
  if (mode === 'flash' || mode === 'hyperlocal' || mode === 'hl') return 'flash';
  if (mode === 'v3_warehouse' || mode === 'warehouse') return 'v3_warehouse';
  if (mode === 'v3_marketplace' || mode === 'marketplace' || mode === 'ecommerce' || mode === 'v3') {
    return 'v3_marketplace';
  }

  const host = apiUrl.toLowerCase();
  if (
    host.includes('flash-api.shadowfax') ||
    host.includes('hlbackend') ||
    host.includes('hyperlocal')
  ) {
    return 'flash';
  }
  return 'v3_marketplace';
}

export function normalizeShadowfaxApiBase(
  apiUrl: string,
  mode: ShadowfaxApiMode = 'v3_marketplace',
): string {
  let base = apiUrl.trim().replace(/\/$/, '');
  if (!base) return '';
  if (mode === 'flash') return base.replace(/\/api\/v3\/?$/i, '').replace(/\/api\/?$/i, '');

  // V3 docs define base URL as https://dale.shadowfax.in/api.
  // Accept old host-only and /api/v3 inputs, but resolve to one canonical /api base.
  base = base
    .replace(/\/api\/api\/?$/i, '/api')
    .replace(/\/api\/v3\/?$/i, '')
    .replace(/\/v3\/?$/i, '')
    .replace(/\/api\/?$/i, '');
  base = base.replace(/\/$/, '');
  return `${base}/api`;
}

function joinPath(basePath: string, path: string): string {
  const cleanBase = basePath.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

export function shadowfaxRequestUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, '');
  return joinPath(base, path);
}

export function shadowfaxRequestPath(baseUrl: string, path: string): string {
  try {
    const url = new URL(shadowfaxRequestUrl(baseUrl, path));
    return url.pathname;
  } catch {
    return path.startsWith('/') ? path : `/${path}`;
  }
}

export function maskShadowfaxToken(token: string): string {
  if (!token) return '(not set)';
  if (token.length <= 8) return '****';
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

export function assertSupportedShadowfaxPath(mode: ShadowfaxApiMode, path: string): void {
  if (mode === 'flash') return;
  if (path.includes('/api/')) {
    throw new Error(`Shadowfax endpoint path must be relative to /api base: ${path}`);
  }
  if (mode === 'v3_marketplace' && path.includes('/clients/shipments/')) {
    throw new Error(`Shadowfax marketplace mode cannot use warehouse shipment endpoint: ${path}`);
  }
}

export function shadowfaxRequestTarget(baseUrl: string, path: string): string {
  try {
    const url = new URL(shadowfaxRequestUrl(baseUrl, path));
    return `${url.host}${url.pathname}`;
  } catch {
    return path;
  }
}
