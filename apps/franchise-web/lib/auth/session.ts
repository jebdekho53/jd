import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieMaxAge,
  cookieOptions,
  REFRESH_MAX_AGE,
} from '@/lib/auth/cookies';
import { backendFetch, BackendError } from '@/lib/auth/backend-fetch';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export async function getAccessToken(req?: NextRequest): Promise<string | undefined> {
  const authHeader = req?.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value;
}

async function getRefreshToken(): Promise<string | undefined> {
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
    jar.set(ACCESS_COOKIE, data.data.accessToken, { ...cookieOptions, maxAge: accessCookieMaxAge(data.data.expiresIn) });
    jar.set(REFRESH_COOKIE, data.data.refreshToken, { ...cookieOptions, maxAge: REFRESH_MAX_AGE });
    return data.data.accessToken;
  } catch {
    return null;
  }
}

export async function fetchWithAuth<T>(path: string, init?: RequestInit, req?: NextRequest): Promise<T> {
  let accessToken = await getAccessToken(req);
  if (!accessToken) accessToken = (await refreshAccessToken()) ?? undefined;
  if (!accessToken) throw new BackendError('Not authenticated', 401);

  try {
    const { data } = await backendFetch<ApiResponse<T>>(path, { ...init, accessToken });
    return data.data;
  } catch (err) {
    if (err instanceof BackendError && err.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const { data } = await backendFetch<ApiResponse<T>>(path, { ...init, accessToken: refreshed });
        return data.data;
      }
    }
    throw err;
  }
}

export function errorResponse(err: unknown) {
  if (err instanceof BackendError) {
    return NextResponse.json({ success: false, message: err.message }, { status: err.status });
  }
  return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
}

export async function proxyGet(path: string, searchParams?: URLSearchParams, req?: NextRequest) {
  try {
    const fullPath = searchParams?.size ? `${path}?${searchParams.toString()}` : path;
    const data = await fetchWithAuth(fullPath, { method: 'GET' }, req);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function proxyPost(req: NextRequest, path: string) {
  try {
    const body = await req.text();
    const data = await fetchWithAuth(path, { method: 'POST', body, headers: { 'Content-Type': 'application/json' } }, req);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function proxyPatch(req: NextRequest, path: string) {
  try {
    const body = await req.text();
    const data = await fetchWithAuth(path, { method: 'PATCH', body, headers: { 'Content-Type': 'application/json' } }, req);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return errorResponse(err);
  }
}
