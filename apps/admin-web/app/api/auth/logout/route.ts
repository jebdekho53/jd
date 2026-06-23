import { NextResponse } from 'next/server';
import { clearAuthCookies, fetchWithAuth } from '@/lib/auth/session';

export async function POST() {
  try {
    await fetchWithAuth('/auth/logout', { method: 'POST', body: '{}' });
  } catch {
    /* ignore */
  }
  const response = NextResponse.json({ success: true });
  clearAuthCookies(response);
  return response;
}
