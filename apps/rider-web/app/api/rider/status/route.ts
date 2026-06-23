import { NextRequest } from 'next/server';
import { proxyPatch } from '@/lib/auth/session';

export async function PATCH(req: NextRequest) {
  return proxyPatch(req, '/rider/status');
}
