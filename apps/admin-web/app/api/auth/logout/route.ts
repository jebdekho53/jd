import { NextResponse } from 'next/server';
import { clearAuthCookies, fetchWithAuth, getRefreshToken } from '@/lib/auth/session';

export async function POST() {
  try {
    const refreshToken = await getRefreshToken();
    await fetchWithAuth('/admin-auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    /* ignore */
  }
  const response = NextResponse.json({ success: true });
  clearAuthCookies(response);
  return response;
}
