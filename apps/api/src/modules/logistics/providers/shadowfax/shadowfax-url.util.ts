export type ShadowfaxApiMode = 'v3' | 'flash';

/**
 * Shadowfax hyperlocal (Flash) hosts use /order/create/.
 * E-commerce V3 hosts use /api/v3/clients/shipments/.
 * SHADOWFAX_API_URL must be the host root only — never include /api/v3 twice.
 */
export function resolveShadowfaxApiMode(
  apiUrl: string,
  explicitMode?: string | null,
): ShadowfaxApiMode {
  const mode = (explicitMode ?? '').trim().toLowerCase();
  if (mode === 'flash' || mode === 'hyperlocal' || mode === 'hl') return 'flash';
  if (mode === 'v3' || mode === 'warehouse' || mode === 'ecommerce') return 'v3';

  const host = apiUrl.toLowerCase();
  if (
    host.includes('flash-api.shadowfax') ||
    host.includes('hlbackend') ||
    host.includes('hyperlocal')
  ) {
    return 'flash';
  }
  return 'v3';
}

export function normalizeShadowfaxApiBase(apiUrl: string): string {
  let base = apiUrl.trim().replace(/\/$/, '');
  // Prevent double /api/v3 when client paths already include it.
  base = base.replace(/\/api\/v3\/?$/i, '');
  return base;
}

export function shadowfaxRequestTarget(baseUrl: string, path: string): string {
  try {
    const host = new URL(baseUrl).host;
    return `${host}${path.startsWith('/') ? path : `/${path}`}`;
  } catch {
    return path;
  }
}
