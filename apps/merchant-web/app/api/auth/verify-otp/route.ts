import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, BackendError } from '@/lib/auth/backend-fetch';
import { setAuthCookies } from '@/lib/auth/session';
import type { ApiResponse, AuthUser, VerifyOtpResult } from '@/types/auth';

interface VerifyBackendData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
  isNewUser: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data } = await backendFetch<ApiResponse<VerifyBackendData>>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const { accessToken, refreshToken, expiresIn, user, isNewUser } = data.data;
    const response = NextResponse.json({ success: true, data: { user, isNewUser, expiresIn } });
    await setAuthCookies(response, { accessToken, refreshToken, expiresIn });
    return response;
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
  }
}
