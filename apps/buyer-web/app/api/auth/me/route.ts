import { NextResponse } from 'next/server';
import {
  clearAuthCookies,
  errorResponse,
  fetchWithAuth,
  getAccessToken,
  getRefreshToken,
} from '@/lib/auth/session';
import { BackendError } from '@/lib/auth/backend-fetch';
import type { AuthUser } from '@/types/auth';

export async function GET() {
  const hasSession = Boolean((await getAccessToken()) || (await getRefreshToken()));
  if (!hasSession) {
    return NextResponse.json({ success: true, data: null });
  }

  try {
    const user = await fetchWithAuth<AuthUser>('/auth/me');
    return NextResponse.json({ success: true, data: user });
  } catch (err) {
    if (err instanceof BackendError && err.status === 401) {
      const response = NextResponse.json({ success: true, data: null });
      clearAuthCookies(response);
      return response;
    }
    return errorResponse(err);
  }
}
