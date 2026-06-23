import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuth } from '@/lib/auth/session';
import { errorResponse } from '@/lib/auth/session';
import type { ApiResponse } from '@/types/buyer';

/** GET proxy: reads cookies, calls backend, forwards JSON response */
export async function proxyGet<T>(path: string, searchParams?: URLSearchParams) {
  try {
    const fullPath = searchParams?.size ? `${path}?${searchParams.toString()}` : path;
    const data = await fetchWithAuth<T>(fullPath);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST proxy: reads body, calls backend with auth */
export async function proxyPost<T>(
  req: NextRequest,
  path: string,
  extraHeaders?: Record<string, string>,
) {
  try {
    const body = await req.text();
    const data = await fetchWithAuth<T>(path, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
    });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

/** PATCH proxy */
export async function proxyPatch<T>(req: NextRequest, path: string) {
  try {
    const body = await req.text();
    const data = await fetchWithAuth<T>(path, {
      method: 'PATCH',
      body,
      headers: { 'Content-Type': 'application/json' },
    });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE proxy */
export async function proxyDelete<T>(path: string) {
  try {
    const data = await fetchWithAuth<T>(path, { method: 'DELETE' });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return errorResponse(err);
  }
}
