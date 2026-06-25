import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest) {
  return proxyGet('/merchant/dashboard/compliance', req.nextUrl.searchParams);
}
