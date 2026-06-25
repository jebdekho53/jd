import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET() {
  return proxyGet('/merchant/earnings');
}
