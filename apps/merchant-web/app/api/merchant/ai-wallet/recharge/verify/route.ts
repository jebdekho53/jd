import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';

export async function POST(req: NextRequest) {
  return proxyPost<{ balancePaise: number; success: boolean }>(
    req,
    '/merchant/ai-wallet/recharge/verify',
    { 'Idempotency-Key': req.headers.get('Idempotency-Key') ?? crypto.randomUUID() },
  );
}
