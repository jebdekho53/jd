import { NextRequest } from 'next/server';
import { proxyGet, proxyPatch } from '@/lib/auth/bff-proxy';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return proxyGet(`/merchant/stores/${storeId}`);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return proxyPatch(req, `/merchant/stores/${storeId}`);
}
