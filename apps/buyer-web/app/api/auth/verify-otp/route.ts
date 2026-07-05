import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/auth/backend-fetch';
import { errorResponse, setAuthCookies } from '@/lib/auth/session';
import type { ApiResponse } from '@/types/auth';
import type { AuthUser } from '@/types/auth';

interface VerifyBackendData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
  isNewUser: boolean;
  rememberMe?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data } = await backendFetch<ApiResponse<VerifyBackendData>>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const { accessToken, refreshToken, expiresIn, user, isNewUser, rememberMe } = data.data;

    const response = NextResponse.json({
      success: true,
      data: { user, isNewUser, expiresIn },
    });

    await setAuthCookies(response, { accessToken, refreshToken, expiresIn, rememberMe });
    return response;
  } catch (err) {
    return errorResponse(err);
  }
}
