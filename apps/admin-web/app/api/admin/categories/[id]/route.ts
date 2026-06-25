import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/auth/backend-fetch';
import { getAccessToken, refreshAccessToken, errorResponse } from '@/lib/auth/session';

async function getToken() {
  let token = await getAccessToken();
  if (!token) token = (await refreshAccessToken()) ?? undefined;
  return token;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = await getToken();
    if (!token) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    const body = await request.json();
    const { data } = await backendFetch<{ success: boolean; data: unknown }>(`/admin/categories/${id}`, {
      method: 'PATCH',
      accessToken: token,
      body: JSON.stringify(body),
    });
    return NextResponse.json({ success: true, data: data.data });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = await getToken();
    if (!token) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    const { data } = await backendFetch<{ success: boolean; data: unknown }>(`/admin/categories/${id}`, {
      method: 'DELETE',
      accessToken: token,
    });
    return NextResponse.json({ success: true, data: data.data });
  } catch (err) {
    return errorResponse(err);
  }
}
