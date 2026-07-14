import type { Metadata } from 'next';
import { getSiteUrl } from '@jebdekho/web-config';
import { BRAND_LOGO_SRC, BRAND_NAME } from '@/lib/brand';

const SITE_NAME = BRAND_NAME;

/**
 * Serialize a JSON-LD object for injection into a <script type="application/ld+json">.
 * `JSON.stringify` does not escape `<`, so a value containing `</script>` (or
 * `<!--`) could break out of the tag. Escaping `<`, `>` and `&` to their unicode
 * forms keeps the payload inert while remaining valid JSON.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

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
    // noindex,follow — keep the page out of the index (search results, 404) while
    // still letting crawlers follow the product/store links it contains.
    robots: opts.noIndex ? { index: false, follow: true } : undefined,
  };
}

export function productJsonLd(product: {
  name: string;
  description?: string | null;
  imageUrls: string[];
  price: number;
  currency?: string;
  brand?: string | null;
  /** Canonical product URL — also used as the stable @id. */
  url?: string;
  /** Stable SKU (variant or product id). Omitted when absent. */
  sku?: string | null;
  /** Manufacturer part number — only pass when it is a real value. */
  mpn?: string | null;
  category?: string | null;
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
    ...(product.url ? { '@id': `${product.url}#product`, url: product.url } : {}),
    name: product.name,
    description: product.description ?? product.name,
    image: images.length > 0 ? images : undefined,
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.mpn ? { mpn: product.mpn } : {}),
    ...(product.category ? { category: product.category } : {}),
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
      ...(product.url ? { url: product.url } : {}),
      price: product.price,
      priceCurrency: product.currency ?? 'INR',
      itemCondition: 'https://schema.org/NewCondition',
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

const SCHEMA_DAY: Record<string, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

/**
 * Build a server-renderable LocalBusiness/Store JSON-LD for a merchant store.
 *
 * Guarantees for Google eligibility + honesty:
 *  - Every property is emitted ONLY when real data exists (no empty strings, no
 *    placeholder phone/address, no invented ratings).
 *  - `@id` is stable + canonical (the /store/[slug] URL), matching `url`.
 *  - aggregateRating is included only when ratingCount > 0.
 *  - Only public business data (name, address, geo, phone, hours, rating).
 */
export function localBusinessJsonLd(business: {
  type?: string;
  /** Canonical /store/[slug] absolute URL — also the stable @id root. */
  url: string;
  name: string;
  description?: string | null;
  image?: string | null;
  logo?: string | null;
  telephone?: string | null;
  priceRange?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    locality?: string | null;
    city?: string | null;
    region?: string | null;
    pincode?: string | null;
  };
  geo?: { lat?: number | null; lng?: number | null };
  openingHours?: { day: string; openTime: string; closeTime: string; isClosed: boolean }[];
  areaServed?: string[];
  aggregateRating?: { ratingValue: number; reviewCount: number };
  sameAs?: string[];
  paymentAccepted?: string | null;
  currenciesAccepted?: string | null;
}) {
  const streetAddress = [business.address?.line1, business.address?.line2]
    .filter((s) => s && s.trim())
    .join(', ');

  const addressParts = business.address;
  const hasAddress =
    streetAddress ||
    addressParts?.locality ||
    addressParts?.city ||
    addressParts?.pincode;

  const openingHours = (business.openingHours ?? [])
    .filter((h) => !h.isClosed && h.openTime && h.closeTime && SCHEMA_DAY[h.day])
    .map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: SCHEMA_DAY[h.day],
      opens: h.openTime,
      closes: h.closeTime,
    }));

  const areaServed = (business.areaServed ?? []).filter((a) => a && a.trim());

  return {
    '@context': 'https://schema.org',
    '@type': business.type ?? 'LocalBusiness',
    '@id': `${business.url}#store`,
    name: business.name,
    url: business.url,
    ...(business.description ? { description: business.description } : {}),
    ...(business.image ? { image: business.image } : {}),
    ...(business.logo ? { logo: business.logo } : {}),
    ...(business.telephone ? { telephone: business.telephone } : {}),
    ...(business.priceRange ? { priceRange: business.priceRange } : {}),
    ...(hasAddress
      ? {
          address: {
            '@type': 'PostalAddress',
            ...(streetAddress ? { streetAddress } : {}),
            ...(addressParts?.locality || addressParts?.city
              ? { addressLocality: addressParts?.locality || addressParts?.city }
              : {}),
            ...(addressParts?.region ? { addressRegion: addressParts.region } : {}),
            ...(addressParts?.pincode ? { postalCode: addressParts.pincode } : {}),
            addressCountry: 'IN',
          },
        }
      : {}),
    ...(business.geo?.lat != null && business.geo?.lng != null
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: business.geo.lat,
            longitude: business.geo.lng,
          },
        }
      : {}),
    ...(openingHours.length > 0 ? { openingHoursSpecification: openingHours } : {}),
    ...(areaServed.length > 0
      ? { areaServed: areaServed.map((name) => ({ '@type': 'Place', name })) }
      : {}),
    ...(business.aggregateRating && business.aggregateRating.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: business.aggregateRating.ratingValue,
            reviewCount: business.aggregateRating.reviewCount,
          },
        }
      : {}),
    ...(business.sameAs && business.sameAs.length > 0 ? { sameAs: business.sameAs } : {}),
    ...(business.paymentAccepted ? { paymentAccepted: business.paymentAccepted } : {}),
    ...(business.currenciesAccepted
      ? { currenciesAccepted: business.currenciesAccepted }
      : {}),
  };
}

/** Map internal StoreType → most specific valid schema.org LocalBusiness subtype. */
export function storeSchemaType(storeType?: string | null): string {
  switch (storeType) {
    case 'RETAIL_STORE':
      return 'Store';
    default:
      return 'LocalBusiness';
  }
}

/** WebSite + SearchAction. Only emit when the search URL genuinely works. */
export function webSiteJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND_NAME,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** Real, already-published support contact — shown in the site footer. */
const SUPPORT_EMAIL = 'support@jebdekho.com';

/**
 * Optional social profile URLs, comma-separated, supplied via env.
 * NEVER invent these — omitted entirely when the env var is unset.
 */
function configuredSameAs(): string[] {
  return (process.env.NEXT_PUBLIC_SOCIAL_URLS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//.test(s));
}

export function organizationJsonLd() {
  const siteUrl = getSiteUrl();
  const sameAs = configuredSameAs();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: BRAND_NAME,
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}${BRAND_LOGO_SRC}`,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: SUPPORT_EMAIL,
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
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
