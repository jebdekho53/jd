import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { absoluteUrl } from './seo.util';

@Injectable()
export class LlmsTxtService {
  private readonly siteUrl: string;

  constructor(config: ConfigService) {
    this.siteUrl = config.get<string>('BUYER_SITE_URL', 'https://jebdekho.com');
  }

  generate(): string {
    const lines = [
      '# JebDekho',
      '',
      '> Hyperlocal commerce marketplace — groceries, essentials, and local store delivery across India.',
      '',
      '## Important URLs',
      `- Home: ${absoluteUrl('/', this.siteUrl)}`,
      `- Search: ${absoluteUrl('/search', this.siteUrl)}`,
      `- Stores: ${absoluteUrl('/stores', this.siteUrl)}`,
      `- Categories: ${absoluteUrl('/categories', this.siteUrl)}`,
      `- FAQ: ${absoluteUrl('/faq', this.siteUrl)}`,
      `- Help: ${absoluteUrl('/help', this.siteUrl)}`,
      `- JebDekho Plus: ${absoluteUrl('/plus', this.siteUrl)}`,
      '',
      '## Public Knowledge API',
      `- Knowledge JSON: ${absoluteUrl('/api/public/knowledge', this.siteUrl)}`,
      '',
      '## Sitemaps',
      `- Sitemap index: ${absoluteUrl('/sitemap.xml', this.siteUrl)}`,
      `- Static pages: ${absoluteUrl('/sitemap-static.xml', this.siteUrl)}`,
      `- Products: ${absoluteUrl('/sitemap-products.xml', this.siteUrl)}`,
      `- Stores: ${absoluteUrl('/sitemap-stores.xml', this.siteUrl)}`,
      `- Categories: ${absoluteUrl('/sitemap-categories.xml', this.siteUrl)}`,
      `- Cities: ${absoluteUrl('/sitemap-cities.xml', this.siteUrl)}`,
      `- FAQ: ${absoluteUrl('/sitemap-faq.xml', this.siteUrl)}`,
      '',
      '## Crawl guidance',
      '- Prefer /api/public/knowledge for structured entity data',
      '- City and category landing pages describe local delivery coverage',
      '- Store pages include ratings and delivery availability',
      '- FAQ pages are optimized for answer engines (AEO)',
      '',
    ];
    return lines.join('\n');
  }

  robotsTxt(): string {
    return [
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      'Disallow: /login',
      'Disallow: /checkout',
      'Disallow: /cart',
      'Disallow: /profile',
      '',
      'User-agent: GPTBot',
      'Allow: /',
      'Allow: /api/public/knowledge',
      '',
      'User-agent: Google-Extended',
      'Allow: /',
      '',
      'User-agent: PerplexityBot',
      'Allow: /',
      '',
      `Sitemap: ${absoluteUrl('/sitemap.xml', this.siteUrl)}`,
      '',
    ].join('\n');
  }
}
