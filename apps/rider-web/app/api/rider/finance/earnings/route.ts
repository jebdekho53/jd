import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  return proxyGet(req, '/rider/finance/earnings');
}
