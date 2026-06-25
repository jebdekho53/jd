import { StoreDetailView } from '@/features/stores/store-detail-view';
import { fetchSeoPage, seoPageMetadata } from '@/lib/seo/seo-pages';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const data = await fetchSeoPage(`/store/${slug}`);
  if (data?.page) return seoPageMetadata(data.page, `/store/${slug}`);
  return seoPageMetadata(
    { title: slug.replace(/-/g, ' '), description: `Order from ${slug.replace(/-/g, ' ')} on JebDekho.` },
    `/store/${slug}`,
  );
}

export default async function StoreSeoPage({ params }: Props) {
  const { slug } = await params;
  const data = await fetchSeoPage(`/store/${slug}`);
  return (
    <>
      {data?.schemas?.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <StoreDetailView slug={slug} />
    </>
  );
}
