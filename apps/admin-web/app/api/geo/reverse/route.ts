import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  return proxyGet(`/geo/geocode/reverse?lat=${lat}&lng=${lng}`);
}
