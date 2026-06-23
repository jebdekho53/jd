import { NextRequest } from 'next/server';
import { proxyPatch } from '@/lib/auth/bff-proxy';

type Params = { params: Promise<{ storeId: string; id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { storeId, id } = await params;
  return proxyPatch(req, `/merchant/stores/${storeId}/products/${id}/status`);
}
