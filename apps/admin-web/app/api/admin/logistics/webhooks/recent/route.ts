import { proxyGet } from '@/lib/auth/bff-proxy';
import { ADMIN_LOGISTICS_WEBHOOKS_RECENT_PATH } from '@/lib/bff/logistics-paths';

export async function GET() {
  return proxyGet(ADMIN_LOGISTICS_WEBHOOKS_RECENT_PATH);
}
