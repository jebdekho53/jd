import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSiteUrl } from '@jebdekho/web-config';
import { StoreDetailView } from '@/features/stores/store-detail-view';
import { getStoreBySlug } from '@/services/buyer/buyer-api';
import { BRAND_LOGO_SRC } from '@/lib/brand';
import {
  createPageMetadata,
  breadcrumbJsonLd,
  localBusinessJsonLd,
  storeSchemaType,
  serializeJsonLd,
} from '@/lib/seo/metadata';
import type { StoreDetail } from '@/types/buyer';

interface Props {
  params: Promise<{ slug: string }>;
}

// JebDekho accepts these payment methods platform-wide (COD + Razorpay), so this
// is a real, accurate value rather than a placeholder.
const PAYMENT_ACCEPTED = 'Cash on Delivery, UPI, Credit Card, Debit Card, Net Banking';

/** Server-side, cached fetch. Returns null on 404/any error so the page 404s. */
async function loadStore(slug: string): Promise<StoreDetail | null> {
  try {
    return await getStoreBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await loadStore(slug);
  const path = `/store/${slug}`;

  if (!store) {
    return createPageMetadata({
      title: 'Store',
      description: 'Order from local stores on JebDekho.',
      path,
      noIndex: true,
    });
  }

  const locationSuffix = store.city ? ` in ${store.city}` : '';
  const title = `${store.name}${locationSuffix}`;
  const description =
    store.description?.slice(0, 155) ??
    `Order from ${store.name}${locationSuffix} on JebDekho — compare prices and get fast hyperlocal delivery.`;

  const siteUrl = getSiteUrl();
  const ogImage = store.bannerUrl ?? store.logoUrl ?? `${siteUrl}${BRAND_LOGO_SRC}`;

  return {
    ...createPageMetadata({ title, description, path }),
    openGraph: {
      title,
      description,
      url: `${siteUrl}${path}`,
      siteName: 'JebDekho',
      type: 'website',
      locale: 'en_IN',
      images: [{ url: ogImage, alt: store.name }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default async function StoreSeoPage({ params }: Props) {
  const { slug } = await params;
  const store = await loadStore(slug);
  if (!store) notFound();

  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/store/${slug}`;

  const areaServed = [
    ...store.serviceAreas.map((a) => a.name),
    ...(store.city ? [store.city] : []),
  ];

  const localBusiness = localBusinessJsonLd({
    type: storeSchemaType(store.storeType),
    url: canonicalUrl,
    name: store.name,
    description: store.description,
    image: store.bannerUrl ?? store.logoUrl,
    logo: store.logoUrl,
    telephone: store.phone,
    address: {
      line1: store.address.line1,
      line2: store.address.line2,
      locality: store.locality,
      city: store.city,
      pincode: store.address.pincode,
    },
    geo: { lat: store.latitude, lng: store.longitude },
    openingHours: store.hours,
    areaServed,
    aggregateRating:
      store.ratingCount > 0
        ? { ratingValue: store.ratingAvg, reviewCount: store.ratingCount }
        : undefined,
    paymentAccepted: PAYMENT_ACCEPTED,
    currenciesAccepted: 'INR',
  });

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: siteUrl },
    { name: 'Stores', url: `${siteUrl}/stores` },
    { name: store.name, url: canonicalUrl },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(localBusiness) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumb) }}
      />
      <StoreDetailView slug={slug} />
    </>
  );
}
