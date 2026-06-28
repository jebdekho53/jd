import { getSiteUrl } from '@jebdekho/web-config';
import { createPageMetadata, breadcrumbJsonLd, itemListJsonLd } from '@/lib/seo/metadata';
import { CuisineListingContent } from '@/features/food/cuisine-listing-content';
import { apiGet } from '@/services/api/client';
import type { ApiResponse } from '@/types/buyer';
import type { Cuisine } from '@/types/food';

interface Props {
  params: Promise<{ slug: string }>;
}

async function fetchCuisine(slug: string): Promise<Cuisine | null> {
  try {
    const res = await apiGet<ApiResponse<Cuisine[]>>('/buyer/cuisines');
    return res.data.find((c) => c.slug === slug) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const cuisine = await fetchCuisine(slug);
  const name = cuisine?.name ?? slug.replace(/-/g, ' ');
  return createPageMetadata({
    title: `${name} food delivery`,
    description: `Order ${name.toLowerCase()} from top restaurants near you. Fast delivery on JebDekho.`,
    path: `/cuisine/${slug}`,
  });
}

export default async function CuisinePage({ params }: Props) {
  const { slug } = await params;
  const cuisine = await fetchCuisine(slug);
  const name = cuisine?.name ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const siteUrl = getSiteUrl();

  const schemas = [
    breadcrumbJsonLd([
      { name: 'Home', url: siteUrl },
      { name: 'Food', url: `${siteUrl}/food` },
      { name, url: `${siteUrl}/cuisine/${slug}` },
    ]),
    itemListJsonLd([
      { name: 'All restaurants', url: `${siteUrl}/restaurants` },
      { name: 'Food home', url: `${siteUrl}/food` },
    ]),
  ];

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <CuisineListingContent cuisineName={name} cuisineSlug={slug} />
    </>
  );
}
