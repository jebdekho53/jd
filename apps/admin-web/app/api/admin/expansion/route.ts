import { NextRequest } from 'next/server';
import { proxyGet, proxyPost, proxyPatch } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest) {
  return proxyGet('/admin/expansion/overview', req.nextUrl.searchParams);
}
