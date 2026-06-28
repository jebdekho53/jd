import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';
import type { FoodCodCheckoutResult } from '@/types/food';

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get('Idempotency-Key') ?? crypto.randomUUID();
  return proxyPost<FoodCodCheckoutResult>(req, '/buyer/food-checkout/cod', {
    'Idempotency-Key': idempotencyKey,
  });
}
