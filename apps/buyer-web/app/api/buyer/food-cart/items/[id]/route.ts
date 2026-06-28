import { NextRequest } from 'next/server';
import { proxyDelete, proxyPatch } from '@/lib/auth/bff-proxy';
import type { FoodCart } from '@/types/food';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyPatch<FoodCart | null>(req, `/buyer/food-cart/items/${id}`);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyDelete<FoodCart | null>(`/buyer/food-cart/items/${id}`);
}
