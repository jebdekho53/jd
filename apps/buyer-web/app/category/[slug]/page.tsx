import Link from 'next/link';
import { StaticPageLayout } from '@/components/common/static-page-layout';
import { fetchSeoPage, seoPageMetadata } from '@/lib/seo/seo-pages';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const path = `/category/${slug}`;
  const data = await fetchSeoPage(path);
  if (data?.page) return seoPageMetadata(data.page, path);
  return seoPageMetadata(
    { title: slug.replace(/-/g, ' '), description: `Shop ${slug.replace(/-/g, ' ')} on JebDekho.` },
    path,
  );
}

export default async function CategorySeoPage({ params }: Props) {
  const { slug } = await params;
  const data = await fetchSeoPage(`/category/${slug}`);
  const page = data?.page;

  return (
    <StaticPageLayout title={page?.h1 ?? slug.replace(/-/g, ' ')} subtitle={page?.description}>
      {data?.schemas?.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <Link href={`/categories/${slug}`} className="font-medium text-primary hover:underline">
        View category products →
      </Link>
    </StaticPageLayout>
  );
}
