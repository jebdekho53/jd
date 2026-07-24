import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ walletId: string; action: string }> },
) {
  const { walletId, action } = await params;
  return proxyPost(req, `/admin/rewards/wallets/${walletId}/${action}`);
}
