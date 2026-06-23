import { NextRequest } from 'next/server';
import { proxyGet, proxyPatch, proxyDelete } from '@/lib/auth/bff-proxy';

type Params = { params: Promise<{ storeId: string; id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { storeId, id } = await params;
  return proxyGet(`/merchant/stores/${storeId}/products/${id}`);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { storeId, id } = await params;
  return proxyPatch(req, `/merchant/stores/${storeId}/products/${id}`);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { storeId, id } = await params;
  return proxyDelete(`/merchant/stores/${storeId}/products/${id}`);
}
