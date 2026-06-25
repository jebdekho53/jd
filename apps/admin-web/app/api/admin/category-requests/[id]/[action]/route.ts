import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/auth/backend-fetch';
import { getAccessToken, refreshAccessToken, errorResponse } from '@/lib/auth/session';

async function getToken() {
  let token = await getAccessToken();
  if (!token) token = (await refreshAccessToken()) ?? undefined;
  return token;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; action: string }> }) {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    const { id, action } = await params;
    const body = await req.text();
    const { data } = await backendFetch<{ success: boolean; data: unknown }>(
      `/admin/category-requests/${id}/${action}`,
      {
        method: 'POST',
        accessToken: token,
        body: body || '{}',
        headers: { 'Content-Type': 'application/json' },
      },
    );
    return NextResponse.json({ success: true, data: data.data });
  } catch (err) {
    return errorResponse(err);
  }
}
