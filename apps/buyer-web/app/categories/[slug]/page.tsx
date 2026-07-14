import { getSiteUrl } from '@jebdekho/web-config';
import { CategoryDetailContent } from '@/features/categories/category-detail-content';
import { createPageMetadata, breadcrumbJsonLd, serializeJsonLd } from '@/lib/seo/metadata';
import { resolveCategorySlug } from '@/lib/categories';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = resolveCategorySlug([], slug);
  return createPageMetadata({
    // Template appends "| JebDekho" — keep the raw category name here.
    title: category.name,
    description: `Shop ${category.name.toLowerCase()} from nearby stores on JebDekho — compare prices and get fast hyperlocal delivery.`,
    path: `/categories/${slug}`,
  });
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = resolveCategorySlug([], slug);
  const siteUrl = getSiteUrl();

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: siteUrl },
    { name: 'Categories', url: `${siteUrl}/categories` },
    { name: category.name, url: `${siteUrl}/categories/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumb) }}
      />
      <CategoryDetailContent slug={slug} />
    </>
  );
}
