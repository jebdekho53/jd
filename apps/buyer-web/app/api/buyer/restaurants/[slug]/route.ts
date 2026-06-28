import { proxyPublicGet } from '@/lib/auth/bff-proxy';
import type { RestaurantDetail } from '@/types/food';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  return proxyPublicGet<RestaurantDetail>(`/buyer/restaurants/${slug}`);
}
