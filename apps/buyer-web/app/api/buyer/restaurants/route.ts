import { NextRequest } from 'next/server';
import { proxyPublicGet } from '@/lib/auth/bff-proxy';
import type { RestaurantSummary } from '@/types/food';

export async function GET(req: NextRequest) {
  return proxyPublicGet<RestaurantSummary[]>('/buyer/restaurants', req.nextUrl.searchParams);
}
