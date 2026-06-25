import { NextResponse } from 'next/server';
import { clearAuthCookies, errorResponse, fetchWithAuth } from '@/lib/auth/session';

export async function POST() {
  try {
    const data = await fetchWithAuth('/admin-auth/logout-all', {
      method: 'POST',
      body: '{}',
    });
    const response = NextResponse.json({ success: true, data });
    clearAuthCookies(response);
    return response;
  } catch (err) {
    return errorResponse(err);
  }
}
