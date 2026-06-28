import { proxyPublicGet } from '@/lib/auth/bff-proxy';
import type { HomeVertical } from '@/types/food';

export async function GET() {
  return proxyPublicGet<HomeVertical[]>('/buyer/verticals');
}
