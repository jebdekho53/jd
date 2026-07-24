import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  return proxyGet('/admin/finance/commission-rules/store-search', params);
}
