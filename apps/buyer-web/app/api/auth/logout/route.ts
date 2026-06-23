import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/auth/backend-fetch';
import {
  clearAuthCookies,
  errorResponse,
  getAccessToken,
  getRefreshToken,
} from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = await getRefreshToken();
    const accessToken = await getAccessToken();

    if (refreshToken && accessToken) {
      await backendFetch('/auth/logout', {
        method: 'POST',
        accessToken,
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {
        // Best-effort revoke — still clear cookies
      });
    }

    const response = NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
    clearAuthCookies(response);
    return response;
  } catch (err) {
    const response = errorResponse(err);
    clearAuthCookies(response);
    return response;
  }
}
