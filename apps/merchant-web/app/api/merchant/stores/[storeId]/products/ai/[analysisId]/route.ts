import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ storeId: string; analysisId: string }> }) {
  const { storeId, analysisId } = await params;
  return proxyGet(`/merchant/stores/${storeId}/products/ai/${analysisId}`);
}
