import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET() {
  return proxyGet('/merchant/onboarding/application');
}

export async function PATCH(req: NextRequest) {
  const { proxyPatch } = await import('@/lib/auth/bff-proxy');
  return proxyPatch(req, '/merchant/onboarding/application');
}
