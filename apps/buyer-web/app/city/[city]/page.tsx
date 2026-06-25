import Link from 'next/link';
import { StaticPageLayout } from '@/components/common/static-page-layout';
import { fetchSeoPage, seoPageMetadata } from '@/lib/seo/seo-pages';

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { city } = await params;
  const data = await fetchSeoPage(`/city/${city}`);
  if (data?.page) return seoPageMetadata(data.page, `/city/${city}`);
  return seoPageMetadata(
    { title: `Delivery in ${city}`, description: `Hyperlocal delivery in ${city} on JebDekho.` },
    `/city/${city}`,
  );
}

export default async function CityPage({ params }: Props) {
  const { city } = await params;
  const data = await fetchSeoPage(`/city/${city}`);
  const page = data?.page;

  return (
    <StaticPageLayout
      title={page?.h1 ?? `Delivery in ${city.replace(/-/g, ' ')}`}
      subtitle={page?.description}
    >
      {data?.schemas?.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <p className="text-sm text-jd-text-muted">
        Discover local stores and get fast hyperlocal delivery with JebDekho.
      </p>
      <Link href={`/search?q=grocery&city=${city}`} className="mt-4 inline-block font-medium text-primary hover:underline">
        Browse stores in this city →
      </Link>
      {(page?.faqs ?? []).length > 0 && (
        <div className="not-prose mt-8 space-y-3">
          <h2 className="font-semibold">Frequently asked questions</h2>
          {page!.faqs.map((f) => (
            <details key={f.question} className="rounded-2xl border border-border/50 bg-card p-4">
              <summary className="cursor-pointer font-medium">{f.question}</summary>
              <p className="mt-2 text-sm text-jd-text-muted">{f.answer}</p>
            </details>
          ))}
        </div>
      )}
    </StaticPageLayout>
  );
}
