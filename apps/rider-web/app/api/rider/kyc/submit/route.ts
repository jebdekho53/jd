import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  return proxyPost(req, '/rider/kyc/submit');
}
