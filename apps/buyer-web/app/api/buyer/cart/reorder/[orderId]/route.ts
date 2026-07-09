import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';
import type { Cart } from '@/types/cart';

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return proxyPost<{ cart: Cart | null; added: number; skipped: number }>(
    req,
    `/buyer/cart/reorder/${orderId}`,
  );
}
