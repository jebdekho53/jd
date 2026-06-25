import { CategoryDetailContent } from '@/features/categories/category-detail-content';
import { createPageMetadata } from '@/lib/seo/metadata';
import { resolveCategorySlug } from '@/lib/categories';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = resolveCategorySlug([], slug);
  return createPageMetadata({
    title: category.name,
    description: `Shop ${category.name.toLowerCase()} from nearby stores on JebDekho.`,
    path: `/categories/${slug}`,
  });
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CategoryDetailContent slug={slug} />;
}
