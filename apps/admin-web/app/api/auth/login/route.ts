import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, BackendError } from '@/lib/auth/backend-fetch';
import { setAuthCookies } from '@/lib/auth/session';
import type { ApiResponse, AuthUser } from '@/types/admin';

interface LoginBackendData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
  rememberMe?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data } = await backendFetch<ApiResponse<LoginBackendData>>('/admin-auth/login', {
      method: 'POST',
      body: JSON.stringify({ ...body, deviceName: 'admin-web' }),
    });
    const { accessToken, refreshToken, expiresIn, user, rememberMe } = data.data;
    const response = NextResponse.json({ success: true, data: { user, expiresIn } });
    await setAuthCookies(response, { accessToken, refreshToken, expiresIn, rememberMe });
    return response;
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
  }
}
