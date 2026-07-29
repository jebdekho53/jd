import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

/**
 * Documents the signed-in buyer still owes for this portal. Empty means they are
 * clear to transact; a non-empty list drives the checkout re-accept gate.
 */
export async function GET(req: NextRequest) {
  const portal = req.nextUrl.searchParams.get('portal') ?? 'buyer';
  return proxyGet('/legal/pending', new URLSearchParams({ portal }));
}
