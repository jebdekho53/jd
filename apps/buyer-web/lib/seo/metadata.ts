import type { Metadata } from 'next';
import { getSiteUrl } from '@jebdekho/web-config';

const SITE_NAME = 'JebDekho';

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
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? product.name,
    image: product.imageUrls[0],
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency ?? 'INR',
      availability: 'https://schema.org/InStock',
    },
  };
}
