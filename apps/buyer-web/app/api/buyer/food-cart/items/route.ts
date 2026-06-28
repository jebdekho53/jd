import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';
import type { FoodCart } from '@/types/food';

export async function POST(req: NextRequest) {
  return proxyPost<FoodCart>(req, '/buyer/food-cart/items');
}
