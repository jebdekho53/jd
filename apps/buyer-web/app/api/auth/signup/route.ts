import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/auth/backend-fetch';
import { errorResponse, setAuthCookies } from '@/lib/auth/session';
import type { ApiResponse, AuthUser } from '@/types/auth';

interface AuthBackendData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
  isNewUser: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data } = await backendFetch<ApiResponse<AuthBackendData>>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ ...body, deviceName: 'buyer-web' }),
    });

    const { accessToken, refreshToken, expiresIn, user, isNewUser } = data.data;
    const response = NextResponse.json({ success: true, data: { user, isNewUser, expiresIn } });
    await setAuthCookies(response, { accessToken, refreshToken, expiresIn });
    return response;
  } catch (err) {
    return errorResponse(err);
  }
}
