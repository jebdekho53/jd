import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.search; // ?status=&page=&limit=
  return proxyGet(`/admin/rewards/referrals${qs}`);
}
