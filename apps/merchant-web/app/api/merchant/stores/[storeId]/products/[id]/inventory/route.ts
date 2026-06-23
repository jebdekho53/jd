import { NextRequest } from 'next/server';
import { proxyPatch } from '@/lib/auth/bff-proxy';

type Params = { params: Promise<{ storeId: string; id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { storeId, id } = await params;
  const variantId = new URL(req.url).searchParams.get('variantId') ?? '';
  const path = `/merchant/stores/${storeId}/products/${id}/inventory${variantId ? `?variantId=${variantId}` : ''}`;
  return proxyPatch(req, path);
}
