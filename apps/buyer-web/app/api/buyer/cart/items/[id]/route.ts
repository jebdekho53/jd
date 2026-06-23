import { NextRequest } from 'next/server';
import { proxyPatch, proxyDelete } from '@/lib/auth/bff-proxy';
import type { Cart } from '@/types/cart';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyPatch<Cart | null>(req, `/buyer/cart/items/${id}`);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyDelete<Cart | null>(`/buyer/cart/items/${id}`);
}
