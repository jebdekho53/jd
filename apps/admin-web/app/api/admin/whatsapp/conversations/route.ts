import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: Request) {
  return proxyGet('/admin/whatsapp/conversations', new URL(req.url).searchParams);
}
