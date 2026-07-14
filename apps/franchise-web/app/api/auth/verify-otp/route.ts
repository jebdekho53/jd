import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, BackendError } from '@/lib/auth/backend-fetch';
import { setAuthCookies } from '@/lib/auth/session';
import { isFranchisePartner, type ApiResponse, type AuthBackendData } from '@/types/auth';

/** Phone + OTP login. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data } = await backendFetch<ApiResponse<AuthBackendData>>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ ...body, deviceName: 'franchise-web' }),
    });
    const { accessToken, refreshToken, expiresIn, user, rememberMe } = data.data;

    // A correct OTP proves who you are, not that you may enter this portal.
    if (!isFranchisePartner(user)) {
      return NextResponse.json(
        { success: false, message: 'This account is not a franchise partner.' },
        { status: 403 },
      );
    }

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
