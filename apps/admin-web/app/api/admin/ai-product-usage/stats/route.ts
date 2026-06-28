import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest) {
  return proxyGet('/admin/ai-product-usage/stats', new URL(req.url).searchParams);
}
