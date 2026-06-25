import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { absoluteUrl, SITE_NAME } from './seo.util';

@Injectable()
export class SchemaMarkupService {
  private readonly siteUrl: string;

  constructor(config: ConfigService) {
    this.siteUrl = config.get<string>('BUYER_SITE_URL', 'https://jebdekho.com');
  }

  organization() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: this.siteUrl,
      logo: absoluteUrl('/logo.png', this.siteUrl),
      sameAs: [],
    };
  }

  webSite() {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: this.siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${this.siteUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };
  }

  localBusiness(store: {
    name: string;
    slug: string;
    address?: string | null;
    city?: string;
    ratingAvg?: number;
    ratingCount?: number;
    logoUrl?: string | null;
  }) {
    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: store.name,
      image: store.logoUrl,
      url: absoluteUrl(`/store/${store.slug}`, this.siteUrl),
      address: store.address ?? store.city,
      aggregateRating:
        store.ratingAvg && store.ratingCount
          ? {
              '@type': 'AggregateRating',
              ratingValue: store.ratingAvg,
              reviewCount: store.ratingCount,
            }
          : undefined,
    };
  }

  product(product: {
    name: string;
    description?: string | null;
    imageUrls: string[];
    price: number;
    currency?: string;
    ratingAvg?: number;
    ratingCount?: number;
  }) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description ?? product.name,
      image: product.imageUrls,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency ?? 'INR',
        availability: 'https://schema.org/InStock',
      },
      aggregateRating:
        product.ratingAvg && product.ratingCount
          ? {
              '@type': 'AggregateRating',
              ratingValue: product.ratingAvg,
              reviewCount: product.ratingCount,
            }
          : undefined,
    };
  }

  faqPage(faqs: Array<{ question: string; answer: string }>) {
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

  breadcrumbList(items: Array<{ name: string; path: string }>) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: absoluteUrl(item.path, this.siteUrl),
      })),
    };
  }

  forPage(page: { pageType: string; title: string; faqs?: Array<{ question: string; answer: string }> }) {
    const schemas: Record<string, unknown>[] = [this.organization(), this.webSite()];
    if (page.faqs?.length) schemas.push(this.faqPage(page.faqs));
    return schemas;
  }
}
