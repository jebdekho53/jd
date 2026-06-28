import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';
import type { AiWalletRechargeOrder } from '@/services/ai-wallet/ai-wallet-api';

export async function POST(req: NextRequest) {
  return proxyPost<AiWalletRechargeOrder>(req, '/merchant/ai-wallet/recharge/create-order', {
    'Idempotency-Key': req.headers.get('Idempotency-Key') ?? crypto.randomUUID(),
  });
}
