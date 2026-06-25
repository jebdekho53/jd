import { Suspense } from 'react';
import { PageLoading } from '@/components/common/page-loading';
import { ProductDetailContent } from '@/features/products/product-detail-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Product details',
  description: 'View product details, compare prices, and add to cart on JebDekho.',
});

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<PageLoading variant="detail" />}>
      <ProductDetailContent productId={id} />
    </Suspense>
  );
}
