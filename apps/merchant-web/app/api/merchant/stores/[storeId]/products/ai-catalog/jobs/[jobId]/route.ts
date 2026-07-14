import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ storeId: string; jobId: string }> }) {
  const { storeId, jobId } = await params;
  return proxyGet(`/merchant/stores/${storeId}/products/ai-catalog/jobs/${jobId}`);
}
