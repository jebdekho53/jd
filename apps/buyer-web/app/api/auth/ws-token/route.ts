import { NextResponse } from 'next/server';
import { getAccessToken, refreshAccessToken } from '@/lib/auth/session';

/**
 * Returns a short-lived access token for authenticated WebSocket handshakes.
 * Tokens remain httpOnly in cookies; this endpoint is only used by same-origin client JS.
 */
export async function GET() {
  let token = await getAccessToken();
  if (!token) {
    token = (await refreshAccessToken()) ?? undefined;
  }

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 },
    );
  }

  return NextResponse.json({ success: true, data: { token } });
}
