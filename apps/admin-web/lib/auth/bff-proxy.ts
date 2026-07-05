import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuth, errorResponse } from '@/lib/auth/session';

export async function proxyGet<T>(path: string, searchParams?: URLSearchParams) {
  try {
    const fullPath = searchParams?.size ? `${path}?${searchParams.toString()}` : path;
    const data = await fetchWithAuth<T>(fullPath);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function proxyPost<T>(
  req: NextRequest,
  path: string,
  statusCode = 200,
) {
  try {
    const body = await req.text();
    const data = await fetchWithAuth<T>(path, {
      method: 'POST',
      body: body || '{}',
      headers: { 'Content-Type': 'application/json' },
    });
    return NextResponse.json({ success: true, data }, { status: statusCode });
  } catch (err) {
    return errorResponse(err);
  }
}

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

export async function proxyDelete<T>(path: string) {
  try {
    const data = await fetchWithAuth<T>(path, { method: 'DELETE' });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return errorResponse(err);
  }
}
