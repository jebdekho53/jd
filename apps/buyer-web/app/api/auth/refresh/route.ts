import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/auth/backend-fetch';
import {
  clearAuthCookies,
  errorResponse,
  getRefreshToken,
  setAuthCookies,
} from '@/lib/auth/session';
import type { ApiResponse } from '@/types/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const refreshToken = (body as { refreshToken?: string }).refreshToken ?? (await getRefreshToken());

    if (!refreshToken) {
      const response = NextResponse.json(
        { success: false, message: 'No refresh token', statusCode: 401 },
        { status: 401 },
      );
      clearAuthCookies(response);
      return response;
    }

    const { data } = await backendFetch<
      ApiResponse<{ accessToken: string; refreshToken: string; expiresIn: number }>
    >('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    const response = NextResponse.json({
      success: true,
      data: { expiresIn: data.data.expiresIn },
    });

    await setAuthCookies(response, data.data);
    return response;
  } catch (err) {
    const response = errorResponse(err, 401);
    clearAuthCookies(response);
    return response;
  }
}
