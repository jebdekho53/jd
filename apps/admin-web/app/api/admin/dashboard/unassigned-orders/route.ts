import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest) {
  return proxyGet('/admin/dashboard/unassigned-orders', req.nextUrl.searchParams);
}
