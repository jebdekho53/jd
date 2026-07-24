import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, BackendError } from '@/lib/auth/backend-fetch';
import { getAccessToken } from '@/lib/auth/session';
import { ACCESS_COOKIE, cookieOptions, accessCookieMaxAge } from '@/lib/auth/cookies';

interface StepUpData {
  accessToken: string;
  expiresIn: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const accessToken = await getAccessToken(req);

    const { data } = await backendFetch<{ success: boolean; data: StepUpData }>('/auth/step-up', {
      method: 'POST',
      body,
      accessToken,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(ACCESS_COOKIE, data.data.accessToken, {
      ...cookieOptions,
      maxAge: accessCookieMaxAge(data.data.expiresIn),
    });
    return response;
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
  }
}
