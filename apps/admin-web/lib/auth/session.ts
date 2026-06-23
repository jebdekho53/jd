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
import type { ApiResponse } from '@/types/admin';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export async function setAuthCookies(response: NextResponse, tokens: TokenPair) {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...cookieOptions,
    maxAge: accessCookieMaxAge(tokens.expiresIn),
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_MAX_AGE,
  });
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

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

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
  }
}

export async function fetchWithAuth<T>(path: string, init?: RequestInit): Promise<T> {
  let accessToken = await getAccessToken();

  if (!accessToken) {
    accessToken = (await refreshAccessToken()) ?? undefined;
  }
  if (!accessToken) {
    throw new BackendError('Not authenticated', 401);
  }

  try {
    const { data } = await backendFetch<ApiResponse<T>>(path, { ...init, accessToken });
    return data.data;
  } catch (err) {
    if (err instanceof BackendError && err.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const { data } = await backendFetch<ApiResponse<T>>(path, {
          ...init,
          accessToken: refreshed,
        });
        return data.data;
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
