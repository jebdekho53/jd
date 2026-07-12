import { NextResponse } from 'next/server';
import { errorResponse, getAccessToken, refreshAccessToken } from '@/lib/auth/session';

/**
 * Hands the browser a short-lived access token so it can authenticate a
 * Socket.IO connection to the API (the gateway reads `handshake.auth.token`).
 *
 * Every other merchant call goes through the BFF, where the token stays in an
 * httpOnly cookie. A WebSocket cannot use that cookie — the API is on a
 * different origin — so the token has to cross into JS here. The client keeps
 * it in memory only (never localStorage) and refetches it on every reconnect.
 */
export async function GET() {
  try {
    const token = (await getAccessToken()) ?? (await refreshAccessToken());
    if (!token) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json(
      { success: true, data: { token } },
      // Never let a proxy or the browser cache a bearer token.
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
