import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';

export async function POST(req: NextRequest) {
  return proxyPost(req, '/merchant/onboarding/application/attribution');
}
