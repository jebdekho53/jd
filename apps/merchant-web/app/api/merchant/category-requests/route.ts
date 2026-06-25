import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest) {
  const qs = new URL(req.url).searchParams.toString();
  const path = qs ? `/merchant/category-requests?${qs}` : '/merchant/category-requests';
  return proxyGet(path);
}
