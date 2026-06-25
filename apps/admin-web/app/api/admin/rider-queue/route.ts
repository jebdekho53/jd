import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/auth/backend-fetch';
import { getAccessToken, refreshAccessToken, errorResponse } from '@/lib/auth/session';

async function getToken() {
  let token = await getAccessToken();
  if (!token) token = (await refreshAccessToken()) ?? undefined;
  return token;
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken();
    if (!token) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }
    const search = new URL(req.url).searchParams;
    const path = search.size
      ? `/admin/rider-queue?${search.toString()}`
      : '/admin/rider-queue';
    const { data } = await backendFetch<{
      success: boolean;
      data: unknown;
      meta: unknown;
    }>(path, { accessToken: token });
    return NextResponse.json({ success: true, data: data.data, meta: data.meta });
  } catch (err) {
    return errorResponse(err);
  }
}
