import { NextRequest } from 'next/server';
import { proxyPatch } from '@/lib/auth/session';

/** Rider edits their own name and vehicle details. */
export async function PATCH(req: NextRequest) {
  return proxyPatch(req, '/rider/profile');
}
