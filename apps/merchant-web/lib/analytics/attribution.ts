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
  /** Franchise referral code from a franchisee's invite link (`?ref=FR-NCR-01`). */
  ref?: string;
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
 * Read `utm_*` / `fbclid` / `ref` from the current URL and persist them
 * (first-touch). Safe to call on every page load.
 *
 * Merged per field rather than all-or-nothing: a merchant who first arrived from
 * an ad (utm cookie already set) and *later* clicks a franchisee's `?ref=` invite
 * must still be credited to that franchisee. Each field keeps its first value —
 * an existing `ref` is never replaced by a second one. This mirrors the per-field
 * first-touch the API applies in `setAttribution`.
 */
export function captureAttributionFromUrl(): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const incoming: Attribution = {
    utmSource: params.get('utm_source') ?? undefined,
    utmMedium: params.get('utm_medium') ?? undefined,
    utmCampaign: params.get('utm_campaign') ?? undefined,
    utmContent: params.get('utm_content') ?? undefined,
    fbclid: params.get('fbclid') ?? undefined,
    ref: params.get('ref') ?? undefined,
  };

  if (!Object.values(incoming).some(Boolean)) return;

  const stored = getStoredAttribution() ?? {};
  const merged: Attribution = { ...incoming, ...stored }; // stored wins = first-touch

  // Nothing new to record.
  if (JSON.stringify(merged) === JSON.stringify(stored)) return;

  try {
    writeCookie(COOKIE, JSON.stringify(merged));
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
