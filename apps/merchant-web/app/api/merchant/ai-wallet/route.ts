import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest) {
  const page = req.nextUrl.searchParams.get('page') ?? '1';
  return proxyGet(`/merchant/ai-wallet?page=${page}`);
}
