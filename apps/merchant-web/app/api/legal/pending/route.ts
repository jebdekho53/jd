import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

/**
 * Documents the signed-in merchant still owes for this portal. An empty array
 * means they are clear to operate; a non-empty one drives the re-accept gate.
 */
export async function GET(req: NextRequest) {
  const portal = req.nextUrl.searchParams.get('portal') ?? 'merchant';
  return proxyGet('/legal/pending', new URLSearchParams({ portal }));
}
