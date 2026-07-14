import { NextRequest } from 'next/server';
import { proxyPublicPost } from '@/lib/auth/bff-proxy';

/** Anonymous storefront reach/interaction tracking (no auth). */
export async function POST(req: NextRequest) {
  return proxyPublicPost(req, '/track');
}
