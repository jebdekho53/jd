import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';

type Params = { params: Promise<{ storeId: string; id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { storeId, id } = await params;
  const variantId = new URL(req.url).searchParams.get('variantId') ?? '';
  const path = `/merchant/stores/${storeId}/products/${id}/inventory/record-offline-sale${variantId ? `?variantId=${variantId}` : ''}`;
  return proxyPost(req, path);
}
