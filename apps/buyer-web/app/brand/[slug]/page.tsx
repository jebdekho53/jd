import Link from 'next/link';
import { StaticPageLayout } from '@/components/common/static-page-layout';
import { fetchSeoPage, seoPageMetadata } from '@/lib/seo/seo-pages';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const path = `/brand/${slug}`;
  const data = await fetchSeoPage(path);
  if (data?.page) return seoPageMetadata(data.page, path);
  return seoPageMetadata(
    { title: slug.replace(/-/g, ' '), description: `Shop ${slug.replace(/-/g, ' ')} products on JebDekho.` },
    path,
  );
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params;
  const data = await fetchSeoPage(`/brand/${slug}`);
  const page = data?.page;
  const brandName = page?.h1 ?? slug.replace(/-/g, ' ');

  return (
    <StaticPageLayout title={brandName} subtitle={page?.description}>
      {data?.schemas?.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <Link href={`/search?q=${encodeURIComponent(brandName)}`} className="font-medium text-primary hover:underline">
        Search {brandName} products →
      </Link>
    </StaticPageLayout>
  );
}
