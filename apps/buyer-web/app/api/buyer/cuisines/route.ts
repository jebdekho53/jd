import { proxyPublicGet } from '@/lib/auth/bff-proxy';
import type { Cuisine } from '@/types/food';

export async function GET() {
  return proxyPublicGet<Cuisine[]>('/buyer/cuisines');
}
