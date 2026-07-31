import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieMaxAge,
  cookieOptions,
  REFRESH_MAX_AGE,
} from '@/lib/auth/cookies';
import { backendFetch, BackendError } from '@/lib/auth/backend-fetch';
import type { ApiResponse } from '@/types/auth';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  rememberMe?: boolean;
}

export async function setAuthCookies(response: NextResponse, tokens: TokenPair) {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...cookieOptions,
    maxAge: accessCookieMaxAge(tokens.expiresIn),
  });

  const refreshOptions: any = {
    ...cookieOptions,
  };
  if (tokens.rememberMe) {
    refreshOptions.maxAge = REFRESH_MAX_AGE;
  }

  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, refreshOptions);
  return response;
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  return response;
}

export async function getAccessToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value;
}

// Refresh tokens are single-use and rotated server-side (see
// TokenService.rotateRefreshToken) — presenting an already-rotated token is
// treated as theft and revokes every session. The merchant dashboard fires
// several parallel data requests (dashboard stats, orders, notifications…),
// so when the access-token cookie expires, each one independently lands here
// with the SAME still-valid refresh token cookie. Without de-duping, the
// first request rotates it and the rest race in with the now-stale token,
// tripping reuse detection and force-logging-out an actively-browsing
// merchant — exactly the "logged out after 15 min" symptom. Collapsing
// concurrent calls onto one in-flight promise (keyed by the token, safe
// since this server runs as a single PM2 fork instance) makes them share one
// rotation instead of racing.
const inFlightRefreshes = new Map<string, Promise<string | null>>();

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const existing = inFlightRefreshes.get(refreshToken);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const { data } = await backendFetch<ApiResponse<TokenPair>>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      const jar = await cookies();
      jar.set(ACCESS_COOKIE, data.data.accessToken, {
        ...cookieOptions,
        maxAge: accessCookieMaxAge(data.data.expiresIn),
      });
      jar.set(REFRESH_COOKIE, data.data.refreshToken, {
        ...cookieOptions,
        maxAge: REFRESH_MAX_AGE,
      });
      return data.data.accessToken;
    } catch {
      return null;
    } finally {
      inFlightRefreshes.delete(refreshToken);
    }
  })();

  inFlightRefreshes.set(refreshToken, promise);
  return promise;
}

export async function fetchWithAuth<T>(path: string, init?: RequestInit): Promise<T> {
  let accessToken = await getAccessToken();

  if (!accessToken) {
    accessToken = (await refreshAccessToken()) ?? undefined;
  }
  if (!accessToken) {
    throw new BackendError('Not authenticated', 401);
  }

  const attempt = async (token: string) => {
    const { data } = await backendFetch<ApiResponse<T>>(path, { ...init, accessToken: token });
    return data.data;
  };

  try {
    return await attempt(accessToken);
  } catch (err) {
    if (
      err instanceof BackendError &&
      (err.status === 401 || err.status === 403)
    ) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return await attempt(refreshed);
      }
    }
    throw err;
  }
}

export function errorResponse(err: unknown, fallbackStatus = 500) {
  if (err instanceof BackendError) {
    return NextResponse.json(
      { success: false, message: err.message, statusCode: err.status },
      { status: err.status },
    );
  }
  return NextResponse.json(
    { success: false, message: 'Internal server error', statusCode: fallbackStatus },
    { status: fallbackStatus },
  );
}
