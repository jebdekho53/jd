import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: Request) {
  return proxyGet('/admin/finance/cod', new URL(req.url).searchParams);
}
