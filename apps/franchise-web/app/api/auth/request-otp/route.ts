import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, BackendError } from '@/lib/auth/backend-fetch';
import type { ApiResponse } from '@/types/auth';

/**
 * Send a login OTP. Deliberately does not reveal whether the number belongs to a
 * franchise partner — the role check happens on verify, so this endpoint cannot be
 * used to enumerate who our partners are.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data } = await backendFetch<ApiResponse<{ message: string; expiresIn: number }>>(
      '/auth/request-otp',
      { method: 'POST', body: JSON.stringify(body) },
    );
    return NextResponse.json({ success: true, data: data.data });
  } catch (err) {
    if (err instanceof BackendError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
  }
}
