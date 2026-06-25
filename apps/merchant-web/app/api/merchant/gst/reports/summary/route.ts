import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: Request) {
  return proxyGet('/merchant/gst/reports/summary', new URL(req.url).searchParams);
}
