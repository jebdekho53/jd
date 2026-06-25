import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';

export async function POST(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return proxyPost(req, `/merchant/stores/${storeId}/submit-review`);
}
