import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

/** BFF: /api/admin/locations → backend /admin/locations */
export async function GET(req: NextRequest) {
  return proxyGet('/admin/locations', req.nextUrl.searchParams);
}
