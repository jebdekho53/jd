import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await params;
  return proxyGet(`/admin/ai-product-usage/${analysisId}`);
}
