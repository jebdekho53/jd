import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> },
) {
  const { merchantId } = await params;
  return proxyPost(req, `/admin/merchant-ai-wallets/${merchantId}/adjust`);
}
