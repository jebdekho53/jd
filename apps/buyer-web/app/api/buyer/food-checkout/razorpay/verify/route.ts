import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';
import type { FoodPaymentResult } from '@/types/food';

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get('Idempotency-Key') ?? crypto.randomUUID();
  return proxyPost<FoodPaymentResult>(req, '/buyer/food-checkout/razorpay/verify', {
    'Idempotency-Key': idempotencyKey,
  });
}
