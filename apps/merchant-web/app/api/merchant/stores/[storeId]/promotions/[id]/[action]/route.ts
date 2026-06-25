import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string; id: string; action: string }> },
) {
  const { storeId, id, action } = await params;
  return proxyPost(_req, `/merchant/stores/${storeId}/promotions/${id}/${action}`);
}
