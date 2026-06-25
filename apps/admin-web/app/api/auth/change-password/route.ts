import { NextResponse } from 'next/server';
import { clearAuthCookies, errorResponse, fetchWithAuth } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await fetchWithAuth('/admin-auth/change-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const response = NextResponse.json({ success: true, data });
    clearAuthCookies(response);
    return response;
  } catch (err) {
    return errorResponse(err);
  }
}
