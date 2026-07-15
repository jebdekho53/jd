import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/session';

/** Image upload (owner photo). Authenticated — partners only. */
export async function POST(req: NextRequest) {
  return proxyPost(req, '/uploads/image');
}
