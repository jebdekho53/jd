import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';

export async function POST(req: NextRequest, { params }: { params: Promise<{ riderProfileId: string }> }) {
  const { riderProfileId } = await params;
  return proxyPost(req, `/admin/finance/riders/${riderProfileId}/bank-account/verify`);
}
