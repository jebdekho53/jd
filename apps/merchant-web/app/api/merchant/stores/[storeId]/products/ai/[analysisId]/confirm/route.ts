import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';

export async function POST(req: NextRequest, { params }: { params: Promise<{ storeId: string; analysisId: string }> }) {
  const { storeId, analysisId } = await params;
  return proxyPost(req, `/merchant/stores/${storeId}/products/ai/${analysisId}/confirm`);
}
