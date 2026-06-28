import { proxyDelete, proxyGet } from '@/lib/auth/bff-proxy';
import type { FoodCart } from '@/types/food';

export async function GET() {
  return proxyGet<FoodCart | null>('/buyer/food-cart');
}

export async function DELETE() {
  return proxyDelete<FoodCart | null>('/buyer/food-cart');
}
