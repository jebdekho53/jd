import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/auth/backend-fetch';
import { clearAuthCookies } from '@/lib/auth/session';
import { REFRESH_COOKIE } from '@/lib/auth/cookies';

export async function POST() {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;

  // Best-effort server-side revocation; the cookies are cleared regardless, so a
  // backend hiccup can never leave the user stuck in a session they tried to end.
  if (refreshToken) {
    await backendFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null);
  }

  return clearAuthCookies(NextResponse.json({ success: true }));
}
