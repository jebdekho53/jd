import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';
import type { FoodCart } from '@/types/food';

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return proxyPost<{ cart: FoodCart | null; added: number; skipped: number }>(
    req,
    `/buyer/food-cart/reorder/${orderId}`,
  );
}
