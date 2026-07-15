import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@jebdekho/web-config';
import { getAccessToken } from '@/lib/auth/session';

/** The store's shareable card is a PNG — stream it straight from the API. */
export async function GET() {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }
  const upstream = await fetch(`${getApiBaseUrl()}/merchant/marketing-card`, {
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
