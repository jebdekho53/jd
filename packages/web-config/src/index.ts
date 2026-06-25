/**
 * Central production URL registry for JebDekho web apps.
 * Development URLs must be supplied via .env.local — never hardcoded here.
 */
export const PRODUCTION_URLS = {
  api: 'https://api.jebdekho.com/api/v1',
  apiOrigin: 'https://api.jebdekho.com',
  ws: 'wss://api.jebdekho.com',
  buyer: 'https://jebdekho.com',
  admin: 'https://admin.jebdekho.com',
  merchant: 'https://merchant.jebdekho.com',
  rider: 'https://rider.jebdekho.com',
  vendor: 'https://vendor.jebdekho.com',
  franchise: 'https://franchise.jebdekho.com',
} as const;

export const PRODUCTION_CORS_ORIGINS = [
  PRODUCTION_URLS.buyer,
  'https://www.jebdekho.com',
  PRODUCTION_URLS.admin,
  PRODUCTION_URLS.merchant,
  PRODUCTION_URLS.rider,
  PRODUCTION_URLS.vendor,
  PRODUCTION_URLS.franchise,
].join(',');

/** Full API base including /api/v1 */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? PRODUCTION_URLS.api;
}

/** API origin without /api/v1 — used for Socket.IO and sitemap proxy */
export function getApiOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_API_ORIGIN;
  if (explicit) return explicit.replace(/\/$/, '');
  const base = getApiBaseUrl();
  return base.replace(/\/api\/v\d+$/, '');
}

export function getWsBaseUrl(): string {
  return process.env.NEXT_PUBLIC_WS_URL ?? PRODUCTION_URLS.ws;
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? PRODUCTION_URLS.buyer;
}

export function getAppUrl(app: keyof typeof PRODUCTION_URLS): string {
  if (app === 'api' || app === 'apiOrigin' || app === 'ws') {
    return PRODUCTION_URLS[app];
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? PRODUCTION_URLS[app];
}

/** WebSocket base for delivery tracking (Socket.IO on API origin) */
export function getTrackingWsBase(): string {
  return getWsBaseUrl().replace(/\/$/, '');
}
