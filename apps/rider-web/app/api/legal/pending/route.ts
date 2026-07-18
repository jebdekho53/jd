import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/session';

/**
 * Documents the signed-in delivery partner still owes for this portal. Empty
 * means they are clear to work; a non-empty list drives the re-accept gate.
 */
export async function GET(req: NextRequest) {
  const portal = req.nextUrl.searchParams.get('portal') ?? 'rider';
  return proxyGet(req, `/legal/pending?portal=${encodeURIComponent(portal)}`);
}
