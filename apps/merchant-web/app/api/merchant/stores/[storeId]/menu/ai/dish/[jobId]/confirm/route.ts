import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; jobId: string }> },
) {
  const { storeId, jobId } = await params;
  return proxyPost(req, `/merchant/stores/${storeId}/menu/ai/dish/${jobId}/confirm`, {}, 201);
}
