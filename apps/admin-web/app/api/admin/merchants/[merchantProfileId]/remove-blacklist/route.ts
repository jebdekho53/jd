import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ merchantProfileId: string }> },
) {
  const { merchantProfileId } = await params;
  return proxyPost(req, `/admin/merchants/${merchantProfileId}/remove-blacklist`);
}
