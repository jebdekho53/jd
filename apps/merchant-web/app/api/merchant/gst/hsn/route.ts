import { proxyGet, proxyPost } from '@/lib/auth/bff-proxy';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return proxyGet('/merchant/gst/hsn', req.nextUrl.searchParams);
}

export async function POST(req: NextRequest) {
  return proxyPost(req, '/merchant/gst/hsn');
}
