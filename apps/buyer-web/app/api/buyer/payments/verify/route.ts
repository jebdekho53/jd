import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';
import type { VerifyPaymentResult } from '@/types/checkout';

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get('Idempotency-Key') ?? crypto.randomUUID();
  return proxyPost<VerifyPaymentResult>(req, '/payments/razorpay/verify', {
    'Idempotency-Key': idempotencyKey,
  });
}
