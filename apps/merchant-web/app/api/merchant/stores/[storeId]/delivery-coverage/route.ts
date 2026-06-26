import { NextRequest } from 'next/server';
import { proxyDelete, proxyGet, proxyPatch, proxyPost } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return proxyGet(`/merchant/stores/${storeId}/delivery-coverage`, new URL(req.url).searchParams);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return proxyPost(req, `/merchant/stores/${storeId}/delivery-coverage`);
}
