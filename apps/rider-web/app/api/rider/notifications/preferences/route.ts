import { NextRequest } from 'next/server';
import { proxyGet, proxyPatch } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  return proxyGet(req, '/rider/notifications/preferences');
}

export async function PATCH(req: NextRequest) {
  return proxyPatch(req, '/rider/notifications/preferences');
}
