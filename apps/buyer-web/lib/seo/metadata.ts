import type { Metadata } from 'next';
import { getSiteUrl } from '@jebdekho/web-config';
import { BRAND_LOGO_SRC, BRAND_NAME } from '@/lib/brand';

const SITE_NAME = BRAND_NAME;

export function createPageMetadata(opts: {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const siteUrl = getSiteUrl();
  const url = opts.path ? `${siteUrl}${opts.path}` : siteUrl;

  return {
    title: opts.title,
    description: opts.description,
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_IN',
      images: [{ url: BRAND_LOGO_SRC, width: 1254, height: 1254, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
    },
    alternates: opts.path ? { canonical: url } : undefined,
    robots: opts.noIndex ? { index: false, follow: false } : undefined,
  };
}

export function productJsonLd(product: {
  name: string;
  description?: string | null;
  imageUrls: string[];
  price: number;
  currency?: string;
  brand?: string | null;
  inStock?: boolean;
  seller?: { name: string; url?: string };
  aggregateRating?: { ratingValue: number; reviewCount: number };
  reviews?: {
    rating: number;
    comment?: string | null;
    images?: string[];
    author?: string | null;
  }[];
}) {
  const reviewImages =
    product.reviews?.flatMap((r) => r.images ?? []).filter(Boolean) ?? [];
  const images = [...new Set([...product.imageUrls, ...reviewImages])].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? product.name,
    image: images.length > 0 ? images : undefined,
    ...(product.brand
      ? { brand: { '@type': 'Brand', name: product.brand } }
      : {}),
    ...(product.aggregateRating && product.aggregateRating.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.aggregateRating.ratingValue,
            reviewCount: product.aggregateRating.reviewCount,
          },
        }
      : {}),
    ...(product.reviews && product.reviews.length > 0
      ? {
          review: product.reviews.slice(0, 10).map((r) => ({
            '@type': 'Review',
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
            author: { '@type': 'Person', name: r.author ?? 'Buyer' },
            reviewBody: r.comment ?? undefined,
            ...(r.images && r.images.length > 0 ? { image: r.images } : {}),
          })),
        }
      : {}),
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency ?? 'INR',
      availability: product.inStock === false
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      ...(product.seller
        ? {
            seller: {
              '@type': 'Organization',
              name: product.seller.name,
              ...(product.seller.url ? { url: product.seller.url } : {}),
            },
          }
        : {}),
    },
  };
}

/** Generated PDP FAQs for SEO when no CMS FAQs exist. */
export function buildProductPdpFaqs(product: {
  name: string;
  unit: string;
  store: { name: string };
  metadata?: { shelfLife?: string | null; countryOfOrigin?: string | null };
  reviewSummary?: { ratingAvg: number; ratingCount: number };
}): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [
    {
      question: `Where can I buy ${product.name}?`,
      answer: `${product.name} is available on JebDekho from ${product.store.name} with fast delivery.`,
    },
    {
      question: `What is the unit size for ${product.name}?`,
      answer: `This listing is sold per ${product.unit}.`,
    },
  ];
  if (product.metadata?.shelfLife) {
    faqs.push({
      question: `What is the shelf life of ${product.name}?`,
      answer: product.metadata.shelfLife,
    });
  }
  if (product.metadata?.countryOfOrigin) {
    faqs.push({
      question: `What is the country of origin?`,
      answer: product.metadata.countryOfOrigin,
    });
  }
  if (product.reviewSummary && product.reviewSummary.ratingCount > 0) {
    faqs.push({
      question: `What do buyers say about ${product.name}?`,
      answer: `Buyers rate it ${product.reviewSummary.ratingAvg.toFixed(1)} out of 5 based on ${product.reviewSummary.ratingCount} verified reviews.`,
    });
  }
  return faqs;
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqPageJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function localBusinessJsonLd(business: {
  name: string;
  url: string;
  address?: string;
  city?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  reviewCount?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    url: business.url,
    address: business.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: business.address,
          addressLocality: business.city,
          postalCode: business.pincode,
          addressCountry: 'IN',
        }
      : undefined,
    geo:
      business.lat != null && business.lng != null
        ? { '@type': 'GeoCoordinates', latitude: business.lat, longitude: business.lng }
        : undefined,
    aggregateRating:
      business.rating != null
        ? {
            '@type': 'AggregateRating',
            ratingValue: business.rating,
            reviewCount: business.reviewCount ?? 1,
          }
        : undefined,
  };
}

export function organizationJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND_NAME,
    url: siteUrl,
    logo: `${siteUrl}${BRAND_LOGO_SRC}`,
  };
}

export function itemListJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: item.url,
    })),
  };
}
