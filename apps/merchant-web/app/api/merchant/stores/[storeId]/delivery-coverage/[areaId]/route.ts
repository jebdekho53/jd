import { NextRequest } from 'next/server';
import { proxyDelete, proxyPatch } from '@/lib/auth/bff-proxy';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; areaId: string }> },
) {
  const { storeId, areaId } = await params;
  return proxyPatch(req, `/merchant/stores/${storeId}/delivery-coverage/${areaId}`);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string; areaId: string }> },
) {
  const { storeId, areaId } = await params;
  return proxyDelete(`/merchant/stores/${storeId}/delivery-coverage/${areaId}`);
}
