import { proxyPost } from '@/lib/auth/bff-proxy';
import { ADMIN_LOGISTICS_HEALTH_CHECK_PATH } from '@/lib/bff/logistics-paths';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  return proxyPost(req, ADMIN_LOGISTICS_HEALTH_CHECK_PATH);
}
