import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@jebdekho/web-config';
import { getAccessToken } from '@/lib/auth/session';

/**
 * The partner's shareable card is a PNG, so it can't go through the JSON proxy.
 * Stream it straight from the API with the caller's bearer token. This static
 * segment wins over the `[...segments]` catch-all for this exact path.
 */
export async function GET(req: NextRequest) {
  const token = await getAccessToken(req);
  if (!token) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }
  const upstream = await fetch(`${getApiBaseUrl()}/franchise/marketing-card`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!upstream.ok) {
    return NextResponse.json({ success: false }, { status: upstream.status });
  }
  const bytes = Buffer.from(await upstream.arrayBuffer());
  return new NextResponse(bytes, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
  });
}
