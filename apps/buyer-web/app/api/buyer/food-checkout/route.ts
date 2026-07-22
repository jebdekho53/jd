import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';
import type { FoodCheckoutInitiateResult } from '@/types/food';

/** Online (RAZORPAY) food checkout initiation — returns a checkoutId, no order yet. */
export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get('Idempotency-Key') ?? crypto.randomUUID();
  return proxyPost<FoodCheckoutInitiateResult>(req, '/buyer/food-checkout', {
    'Idempotency-Key': idempotencyKey,
  });
}
