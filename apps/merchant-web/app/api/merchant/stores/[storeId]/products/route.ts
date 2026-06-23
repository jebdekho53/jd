import { NextRequest } from 'next/server';
import { proxyGet, proxyPost } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return proxyGet(`/merchant/stores/${storeId}/products`, new URL(req.url).searchParams);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return proxyPost(req, `/merchant/stores/${storeId}/products`, {}, 201);
}
