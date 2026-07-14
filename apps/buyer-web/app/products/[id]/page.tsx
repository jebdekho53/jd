import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getSiteUrl } from '@jebdekho/web-config';
import { PageLoading } from '@/components/common/page-loading';
import { ProductDetailContent } from '@/features/products/product-detail-content';
import {
  createPageMetadata,
  productJsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
  buildProductPdpFaqs,
  serializeJsonLd,
} from '@/lib/seo/metadata';
import { BRAND_LOGO_SRC } from '@/lib/brand';
import { apiGet } from '@/services/api/client';
import type { ApiResponse, BuyerProductWithStore, ProductReview } from '@/types/buyer';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ store?: string; q?: string }>;
};

/** Server fetch of the product (cached). Returns null on 404/any error. */
async function loadProduct(id: string, store?: string): Promise<BuyerProductWithStore | null> {
  try {
    const res = await apiGet<ApiResponse<BuyerProductWithStore>>(`/buyer/products/${id}`, { store });
    return res.data;
  } catch {
    return null;
  }
}

/** Best-effort server fetch of recent reviews for genuine Review JSON-LD. */
async function loadReviews(id: string): Promise<ProductReview[]> {
  try {
    const res = await apiGet<ApiResponse<ProductReview[]>>(`/buyer/products/${id}/reviews`, {
      page: 1,
      limit: 10,
    });
    return res.data ?? [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { store } = await searchParams;
  // Canonical is the clean product URL — a seller/store is a filter of the SAME
  // product, not separate indexable content, so it is dropped from the canonical.
  const path = `/products/${id}`;

  const p = await loadProduct(id, store);
  if (!p) {
    return createPageMetadata({
      title: 'Product details',
      description: 'View product details, compare prices, and add to cart on JebDekho.',
      path,
      noIndex: true,
    });
  }

  const variant = p.variants.find((v) => v.isDefault) ?? p.variants[0];
  const price = variant?.price ?? p.basePrice;
  // No manual "| JebDekho" — the root layout title template appends the brand.
  const title = `${p.name}${p.brand ? ` — ${p.brand}` : ''}`;
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
      url: `${siteUrl}${path}`,
      siteName: 'JebDekho',
      type: 'website',
      locale: 'en_IN',
      images: [{ url: ogImage, alt: p.name }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { store } = await searchParams;

  const [product, reviews] = await Promise.all([loadProduct(id, store), loadReviews(id)]);

  const schemas: object[] = [];
  if (product) {
    const siteUrl = getSiteUrl();
    const canonicalUrl = `${siteUrl}/products/${id}`;
    const variant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
    const price = variant?.price ?? product.basePrice;

    schemas.push(
      productJsonLd({
        name: product.name,
        description: product.description,
        imageUrls: product.imageUrls,
        price,
        url: canonicalUrl,
        sku: variant?.id ?? product.id,
        mpn: product.modelNumber ?? null,
        category: product.category?.name ?? null,
        brand: product.brand,
        inStock: (variant?.availableQty ?? 0) > 0,
        seller: {
          name: product.store.name,
          url: `${siteUrl}/store/${product.store.slug}`,
        },
        aggregateRating:
          product.reviewSummary && product.reviewSummary.ratingCount > 0
            ? {
                ratingValue: product.reviewSummary.ratingAvg,
                reviewCount: product.reviewSummary.ratingCount,
              }
            : undefined,
        reviews: reviews.map((r) => ({
          rating: r.rating,
          comment: r.comment,
          images: r.images,
          author: r.buyer?.name ?? null,
        })),
      }),
      breadcrumbJsonLd([
        { name: 'Home', url: siteUrl },
        { name: 'Products', url: `${siteUrl}/products` },
        ...(product.category
          ? [{ name: product.category.name, url: `${siteUrl}/categories/${product.category.slug}` }]
          : []),
        { name: product.name, url: canonicalUrl },
      ]),
      faqPageJsonLd(
        buildProductPdpFaqs({
          name: product.name,
          unit: product.unit,
          store: product.store,
          metadata: product.metadata,
          reviewSummary: product.reviewSummary,
        }),
      ),
    );
  }

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
      ))}
      <Suspense fallback={<PageLoading variant="detail" />}>
        <ProductDetailContent productId={id} />
      </Suspense>
    </>
  );
}
