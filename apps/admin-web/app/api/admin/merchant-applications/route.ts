import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams;
  return proxyGet('/admin/merchant-applications', search);
}
