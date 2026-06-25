import { proxyGet } from '@/lib/auth/bff-proxy';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const qs = new URL(req.url).searchParams.toString();
  const path = qs ? `/merchant/categories/catalog?${qs}` : '/merchant/categories/catalog';
  return proxyGet(path);
}
