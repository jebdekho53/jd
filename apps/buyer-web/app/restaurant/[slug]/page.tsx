import { getSiteUrl } from '@jebdekho/web-config';
import { createPageMetadata, breadcrumbJsonLd, localBusinessJsonLd, serializeJsonLd } from '@/lib/seo/metadata';
import { RestaurantDetailContent } from '@/features/food/restaurant-detail-content';
import { apiGet } from '@/services/api/client';
import type { ApiResponse } from '@/types/buyer';
import type { RestaurantDetail } from '@/types/food';

interface Props {
  params: Promise<{ slug: string }>;
}

async function fetchRestaurant(slug: string): Promise<RestaurantDetail | null> {
  try {
    const res = await apiGet<ApiResponse<RestaurantDetail>>(`/buyer/restaurants/${slug}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const restaurant = await fetchRestaurant(slug);
  const name = restaurant?.name ?? slug.replace(/-/g, ' ');
  const cuisines = restaurant?.cuisines.map((c) => c.name).join(', ') ?? 'food';
  return createPageMetadata({
    title: `${name} — menu & delivery`,
    description:
      restaurant?.description ??
      `Order from ${name}. ${cuisines}. Fast food delivery on JebDekho.`,
    path: `/restaurant/${slug}`,
  });
}

export default async function RestaurantPage({ params }: Props) {
  const { slug } = await params;
  const restaurant = await fetchRestaurant(slug);
  const siteUrl = getSiteUrl();

  const schemas = restaurant
    ? [
        breadcrumbJsonLd([
          { name: 'Home', url: siteUrl },
          { name: 'Food', url: `${siteUrl}/food` },
          { name: restaurant.name, url: `${siteUrl}/restaurant/${slug}` },
        ]),
        localBusinessJsonLd({
          type: 'Restaurant',
          name: restaurant.name,
          url: `${siteUrl}/restaurant/${slug}`,
          address: {
            line1: restaurant.line1,
            locality: restaurant.locality,
            pincode: restaurant.pincode,
          },
          geo: { lat: restaurant.latitude, lng: restaurant.longitude },
          aggregateRating:
            restaurant.ratingCount > 0
              ? { ratingValue: restaurant.ratingAvg, reviewCount: restaurant.ratingCount }
              : undefined,
        }),
      ]
    : [];

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
      ))}
      <RestaurantDetailContent slug={slug} />
    </>
  );
}
