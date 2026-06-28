import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const search = req.nextUrl.searchParams;
  const qs = search.size ? `?${search.toString()}` : '';
  return proxyGet(`/merchant/stores/${storeId}/products/ai/history${qs}`);
}
