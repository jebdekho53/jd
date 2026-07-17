import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/session';

/** Record the delivery partner's acceptance of an agreement version. */
export async function POST(req: NextRequest) {
  return proxyPost(req, '/legal/accept');
}
