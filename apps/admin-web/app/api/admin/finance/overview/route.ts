import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: Request) {
  const path = new URL(req.url).pathname;
  if (path.endsWith('/alerts')) return proxyGet('/admin/finance/alerts');
  if (path.endsWith('/cod')) return proxyGet('/admin/finance/cod', new URL(req.url).searchParams);
  if (path.endsWith('/revenue')) return proxyGet('/admin/finance/revenue');
  return proxyGet('/admin/finance/overview');
}
