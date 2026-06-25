import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: Request) {
  const url = new URL(req.url);
  return proxyGet('/merchant/crm/customers', url.searchParams);
}
