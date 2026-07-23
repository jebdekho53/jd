import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, BackendError } from '@/lib/auth/backend-fetch';
import { setAuthCookies } from '@/lib/auth/session';

interface VerifyData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    phone: string;
    roles: string[];
    [key: string]: unknown;
  };
  isNewUser: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data } = await backendFetch<{ success: boolean; data: VerifyData }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const { accessToken, refreshToken, expiresIn, user, isNewUser } = data.data;

    // Tokens are never handed to the client — they live in httpOnly cookies and
    // every call goes back out through this BFF.
    const response = NextResponse.json({
      success: true,
      data: { user, profile: null, isNewUser, expiresIn },
    });
    await setAuthCookies(response, { accessToken, refreshToken, expiresIn });

    return response;
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
  }
}
