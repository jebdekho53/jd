/**
 * Supplies a fresh access token for each Socket.IO handshake.
 *
 * The apps keep their access token in an httpOnly cookie, which a cross-origin
 * WebSocket cannot read, so each app exposes a same-origin BFF route that hands
 * the token to client JS. It is held in memory only — never localStorage.
 *
 * Socket.IO reuses whatever `auth` value it was constructed with on every
 * reconnect. Passing a static token therefore breaks permanently once that
 * token expires: the gateway rejects the handshake and the client retries the
 * same dead credential forever. The provider below is called per attempt.
 */

/** Thrown-through signal that the session is gone and retrying is pointless. */
export class RealtimeUnauthorizedError extends Error {
  constructor() {
    super('Not authenticated');
    this.name = 'RealtimeUnauthorizedError';
  }
}

export type TokenProvider = () => Promise<string>;

const DEFAULT_ENDPOINT = '/api/auth/ws-token';

/** Refresh this many seconds before the token's own expiry. */
const EXPIRY_SKEW_SECONDS = 30;

interface CachedToken {
  token: string;
  /** Epoch seconds, or null when the token carries no readable `exp`. */
  expiresAt: number | null;
}

/** Reads `exp` out of a JWT payload without verifying it (the server does that). */
function readExpiry(token: string): number | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(payload)) as { exp?: number };
    return typeof decoded.exp === 'number' ? decoded.exp : null;
  } catch {
    return null;
  }
}

function isFresh(cached: CachedToken | null): cached is CachedToken {
  if (!cached) return false;
  if (cached.expiresAt === null) return false; // Unknown expiry — always refetch.
  return cached.expiresAt - EXPIRY_SKEW_SECONDS > Date.now() / 1000;
}

/**
 * Builds a provider backed by the app's `/api/auth/ws-token` route.
 *
 * Concurrent callers share one in-flight request so a reconnect storm across
 * several hooks does not fan out into several token fetches.
 */
export function createBffTokenProvider(endpoint: string = DEFAULT_ENDPOINT): TokenProvider {
  let cached: CachedToken | null = null;
  let inFlight: Promise<string> | null = null;

  const fetchToken = async (): Promise<string> => {
    const res = await fetch(endpoint, {
      credentials: 'include',
      cache: 'no-store',
    });

    if (res.status === 401 || res.status === 403) {
      cached = null;
      throw new RealtimeUnauthorizedError();
    }
    if (!res.ok) {
      throw new Error(`ws-token request failed (${res.status})`);
    }

    const body = (await res.json()) as { data?: { token?: string } };
    const token = body.data?.token;
    if (!token) {
      cached = null;
      throw new RealtimeUnauthorizedError();
    }

    cached = { token, expiresAt: readExpiry(token) };
    return token;
  };

  return async () => {
    if (isFresh(cached)) return cached.token;
    if (inFlight) return inFlight;

    inFlight = fetchToken().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
}
