import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/session';

/** The signed-in partner's own agreement acceptance history. */
export async function GET(req: NextRequest) {
  return proxyGet(req, '/legal/acceptances');
}
