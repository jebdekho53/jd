import { NextRequest } from 'next/server';
import { proxyGet, proxyPatch, proxyPost } from '@/lib/auth/bff-proxy';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyGet(`/buyer/orders/${id}/review`);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyPost(req, `/buyer/orders/${id}/review`);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyPatch(req, `/buyer/orders/${id}/review`);
}
