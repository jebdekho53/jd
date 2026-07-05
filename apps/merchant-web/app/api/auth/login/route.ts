import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, BackendError } from '@/lib/auth/backend-fetch';
import { setAuthCookies } from '@/lib/auth/session';
import type { ApiResponse, AuthUser } from '@/types/auth';

interface AuthBackendData {
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
    const { data } = await backendFetch<ApiResponse<AuthBackendData>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ ...body, deviceName: 'merchant-web' }),
    });
    const { accessToken, refreshToken, expiresIn, user, isNewUser, rememberMe } = data.data;
    const response = NextResponse.json({ success: true, data: { user, isNewUser, expiresIn } });
    await setAuthCookies(response, { accessToken, refreshToken, expiresIn, rememberMe });
    return response;
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
  }
}
