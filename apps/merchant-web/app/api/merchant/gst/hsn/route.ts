import { proxyGet } from '@/lib/auth/bff-proxy';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return proxyGet('/merchant/gst/hsn', req.nextUrl.searchParams);
}
