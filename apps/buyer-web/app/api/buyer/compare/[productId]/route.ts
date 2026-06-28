import { proxyGet } from '@/lib/auth/bff-proxy';
import type { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  const search = new URL(req.url).searchParams;
  const qs = search.size ? `?${search.toString()}` : '';
  return proxyGet(`/buyer/compare/${productId}${qs}`);
}
