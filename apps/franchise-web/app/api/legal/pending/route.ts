import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/session';

/**
 * Documents the signed-in franchise partner still owes for this portal. Empty
 * means they are clear; a non-empty list drives the re-accept gate.
 */
export async function GET(req: NextRequest) {
  const portal = req.nextUrl.searchParams.get('portal') ?? 'franchise';
  return proxyGet('/legal/pending', new URLSearchParams({ portal }), req);
}
