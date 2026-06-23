import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';
import type { CheckoutResult } from '@/types/checkout';

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get('Idempotency-Key') ?? crypto.randomUUID();
  return proxyPost<CheckoutResult>(req, '/buyer/checkout', {
    'Idempotency-Key': idempotencyKey,
  });
}
