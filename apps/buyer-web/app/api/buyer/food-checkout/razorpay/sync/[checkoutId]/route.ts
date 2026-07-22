import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';
import type { FoodPaymentResult } from '@/types/food';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ checkoutId: string }> },
) {
  const { checkoutId } = await params;
  const idempotencyKey = req.headers.get('Idempotency-Key') ?? crypto.randomUUID();
  return proxyPost<FoodPaymentResult>(
    req,
    `/buyer/food-checkout/razorpay/sync/${checkoutId}`,
    { 'Idempotency-Key': idempotencyKey },
  );
}
