import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/auth/backend-fetch';
import { errorResponse, getAccessToken } from '@/lib/auth/session';
import { ACCESS_COOKIE, cookieOptions, accessCookieMaxAge } from '@/lib/auth/cookies';
import type { ApiResponse } from '@/types/auth';

interface StepUpBackendData {
  accessToken: string;
  expiresIn: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const accessToken = await getAccessToken();

    const { data } = await backendFetch<ApiResponse<StepUpBackendData>>('/auth/step-up', {
      method: 'POST',
      body: JSON.stringify(body),
      accessToken,
    });

    const response = NextResponse.json({ success: true });
    
    // Update the access token cookie
    response.cookies.set(ACCESS_COOKIE, data.data.accessToken, {
      ...cookieOptions,
      maxAge: accessCookieMaxAge(data.data.expiresIn),
    });

    return response;
  } catch (err) {
    return errorResponse(err);
  }
}
