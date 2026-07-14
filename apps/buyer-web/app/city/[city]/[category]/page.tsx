import Link from 'next/link';
import { getSiteUrl } from '@jebdekho/web-config';
import { StaticPageLayout } from '@/components/common/static-page-layout';
import { fetchSeoPage, seoPageMetadata } from '@/lib/seo/seo-pages';
import { breadcrumbJsonLd, serializeJsonLd } from '@/lib/seo/metadata';

interface Props {
  params: Promise<{ city: string; category: string }>;
}

const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export async function generateMetadata({ params }: Props) {
  const { city, category } = await params;
  const path = `/city/${city}/${category}`;
  const data = await fetchSeoPage(path);
  if (data?.page) return seoPageMetadata(data.page, path);
  return seoPageMetadata(
    { title: `${category} in ${city}`, description: `Shop ${category} in ${city} with JebDekho delivery.` },
    path,
  );
}

export default async function CityCategoryPage({ params }: Props) {
  const { city, category } = await params;
  const path = `/city/${city}/${category}`;
  const data = await fetchSeoPage(path);
  const page = data?.page;
  const siteUrl = getSiteUrl();

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: siteUrl },
    { name: titleCase(city), url: `${siteUrl}/city/${city}` },
    { name: titleCase(category), url: `${siteUrl}${path}` },
  ]);

  return (
    <StaticPageLayout
      title={page?.h1 ?? `${category.replace(/-/g, ' ')} in ${city.replace(/-/g, ' ')}`}
      subtitle={page?.description}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumb) }}
      />
      {data?.schemas?.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
      ))}
      <Link href={`/search?q=${encodeURIComponent(category)}`} className="font-medium text-primary hover:underline">
        Search {category.replace(/-/g, ' ')} near you →
      </Link>
    </StaticPageLayout>
  );
}
