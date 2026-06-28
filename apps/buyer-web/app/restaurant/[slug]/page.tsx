import { getSiteUrl } from '@jebdekho/web-config';
import { createPageMetadata, breadcrumbJsonLd, localBusinessJsonLd } from '@/lib/seo/metadata';
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
          name: restaurant.name,
          url: `${siteUrl}/restaurant/${slug}`,
          address: restaurant.line1,
          city: restaurant.locality ?? undefined,
          pincode: restaurant.pincode,
          lat: restaurant.latitude ?? undefined,
          lng: restaurant.longitude ?? undefined,
          rating: restaurant.ratingAvg,
          reviewCount: restaurant.ratingCount,
        }),
      ]
    : [];

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <RestaurantDetailContent slug={slug} />
    </>
  );
}
