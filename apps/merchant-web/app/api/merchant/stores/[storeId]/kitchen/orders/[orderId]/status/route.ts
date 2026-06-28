import { NextRequest } from 'next/server';
import { proxyPatch } from '@/lib/auth/bff-proxy';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; orderId: string }> },
) {
  const { storeId, orderId } = await params;
  return proxyPatch(req, `/merchant/stores/${storeId}/kitchen/orders/${orderId}/status`);
}
