import { NextResponse } from 'next/server';
import { fetchWithAuth, clearAuthCookies, errorResponse } from '@/lib/auth/session';
import { BackendError } from '@/lib/auth/backend-fetch';
import type { AuthUser } from '@/types/auth';

export async function GET() {
  try {
    const user = await fetchWithAuth<AuthUser>('/auth/me');
    return NextResponse.json({ success: true, data: user });
  } catch (err) {
    if (err instanceof BackendError && err.status === 401) {
      const response = NextResponse.json(
        { success: false, message: 'Not authenticated', statusCode: 401 },
        { status: 401 },
      );
      clearAuthCookies(response);
      return response;
    }
    return errorResponse(err);
  }
}
