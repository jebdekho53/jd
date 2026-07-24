import { NextRequest } from 'next/server';
import { proxyPatch, proxyDelete } from '@/lib/auth/bff-proxy';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; menuItemId: string }> },
) {
  const { storeId, menuItemId } = await params;
  return proxyPatch(req, `/merchant/stores/${storeId}/menu/items/${menuItemId}`);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string; menuItemId: string }> },
) {
  const { storeId, menuItemId } = await params;
  return proxyDelete(`/merchant/stores/${storeId}/menu/items/${menuItemId}`);
}
