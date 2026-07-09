import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PageLoading } from '@/components/common/page-loading';
import { ProductDetailContent } from '@/features/products/product-detail-content';
import { createPageMetadata } from '@/lib/seo/metadata';
import { BRAND_LOGO_SRC } from '@/lib/brand';
import { getSiteUrl } from '@jebdekho/web-config';
import { apiGet } from '@/services/api/client';
import type { ApiResponse, BuyerProductWithStore } from '@/types/buyer';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ store?: string; q?: string }>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { store } = await searchParams;
  const path = `/products/${id}${store ? `?store=${store}` : ''}`;

  try {
    const res = await apiGet<ApiResponse<BuyerProductWithStore>>(`/buyer/products/${id}`, {
      store,
    });
    const p = res.data;
    const variant = p.variants.find((v) => v.isDefault) ?? p.variants[0];
    const price = variant?.price ?? p.basePrice;
    const title = `${p.name}${p.brand ? ` — ${p.brand}` : ''} | JebDekho`;
    const description =
      p.description?.slice(0, 155) ??
      `Buy ${p.name} from ${p.store.name}. ₹${price} · ${p.unit}. Fast delivery across India.`;

    const siteUrl = getSiteUrl();
    const ogImage = p.imageUrls[0] ?? `${siteUrl}${BRAND_LOGO_SRC}`;

    return {
      ...createPageMetadata({ title, description, path }),
      openGraph: {
        title,
        description,
        images: [{ url: ogImage, alt: p.name }],
      },
    };
  } catch {
    return createPageMetadata({
      title: 'Product details',
      description: 'View product details, compare prices, and add to cart on JebDekho.',
      path,
    });
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<PageLoading variant="detail" />}>
      <ProductDetailContent productId={id} />
    </Suspense>
  );
}
