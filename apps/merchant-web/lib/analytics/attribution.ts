/**
 * First-touch acquisition attribution for merchant onboarding.
 *
 * When a merchant lands on merchant.jebdekho.com from a Meta / Google ad, the
 * URL carries `utm_*` / `fbclid` params. We stash them in a first-party cookie
 * on first visit (first-touch — never overwritten) so that once the merchant
 * signs up we can tell the backend which campaign referred them.
 */

const COOKIE = 'jd_mkt';
const MAX_AGE_DAYS = 90;

export interface Attribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  fbclid?: string;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Read `utm_*` / `fbclid` from the current URL and, if present and nothing is
 * stored yet, persist them (first-touch). Safe to call on every page load.
 */
export function captureAttributionFromUrl(): void {
  if (typeof window === 'undefined') return;
  if (readCookie(COOKIE)) return; // first-touch already recorded

  const params = new URLSearchParams(window.location.search);
  const attribution: Attribution = {
    utmSource: params.get('utm_source') ?? undefined,
    utmMedium: params.get('utm_medium') ?? undefined,
    utmCampaign: params.get('utm_campaign') ?? undefined,
    utmContent: params.get('utm_content') ?? undefined,
    fbclid: params.get('fbclid') ?? undefined,
  };

  const hasAny = Object.values(attribution).some(Boolean);
  if (!hasAny) return;

  try {
    writeCookie(COOKIE, JSON.stringify(attribution));
  } catch {
    /* ignore */
  }
}

/** Return the stored first-touch attribution, if any. */
export function getStoredAttribution(): Attribution | null {
  const raw = readCookie(COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Attribution;
  } catch {
    return null;
  }
}
