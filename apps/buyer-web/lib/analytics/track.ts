/**
 * Anonymous storefront reach tracking.
 *
 * Generates a stable per-browser session id (localStorage) and fires
 * fire-and-forget events to the public `/api/track` endpoint. Used to power the
 * admin "reach" funnel (visitors → searches → views → cart → checkout).
 *
 * Deliberately silent: tracking must never break the shopping flow, so every
 * failure is swallowed.
 */

const SID_KEY = 'jd_sid';

export type TrackEventType =
  | 'SEARCH'
  | 'VIEW_PRODUCT'
  | 'VIEW_STORE'
  | 'ADD_CART'
  | 'REMOVE_CART'
  | 'CHECKOUT_START';

interface TrackPayload {
  productId?: string;
  storeId?: string;
  metadata?: Record<string, unknown>;
}

/** Events already sent this tab-session, to avoid spamming duplicate views. */
const seen = new Set<string>();

function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    let sid = window.localStorage.getItem(SID_KEY);
    if (!sid) {
      sid =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return null;
  }
}

/**
 * Fire a reach event. `dedupeKey` (when provided) suppresses repeat sends of the
 * same logical event within the current tab — e.g. viewing the same product twice.
 */
export function trackReach(
  eventType: TrackEventType,
  payload: TrackPayload = {},
  dedupeKey?: string,
): void {
  if (typeof window === 'undefined') return;
  const sessionId = getSessionId();
  if (!sessionId) return;

  if (dedupeKey) {
    const key = `${eventType}:${dedupeKey}`;
    if (seen.has(key)) return;
    seen.add(key);
  }

  const body = JSON.stringify({ eventType, sessionId, ...payload });
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never throw from tracking */
  }
}
