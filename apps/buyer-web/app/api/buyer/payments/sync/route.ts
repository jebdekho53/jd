import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';
import type { SyncPaymentResult } from '@/types/checkout';

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get('Idempotency-Key') ?? crypto.randomUUID();
  return proxyPost<SyncPaymentResult>(req, '/payments/razorpay/sync', {
    'Idempotency-Key': idempotencyKey,
  });
}
