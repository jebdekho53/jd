import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SitemapType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { absoluteUrl } from './seo.util';

/** Per-file URL cap. Well under the 50,000-URL / 50MB sitemap protocol limit. */
const SITEMAP_MAX_URLS = 5000;

/** Indexable evergreen static routes (listing + content pages). No noindex pages. */
const STATIC_PATHS = [
  '/',
  '/stores',
  '/categories',
  '/offers',
  '/restaurants',
  '/food',
  '/plus',
  '/faq',
  '/help',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/refund-policy',
];

@Injectable()
export class SitemapService {
  private readonly siteUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.siteUrl = config.get<string>('BUYER_SITE_URL', 'https://jebdekho.com');
  }

  async generateAll(): Promise<void> {
    await Promise.all([
      this.generateType(SitemapType.PRODUCTS, () => this.buildProductsXml()),
      this.generateType(SitemapType.STORES, () => this.buildStoresXml()),
      this.generateType(SitemapType.CATEGORIES, () => this.buildCategoriesXml()),
      this.generateType(SitemapType.CITIES, () => this.buildCitiesXml()),
      this.generateType(SitemapType.FAQ, () => this.buildFaqXml()),
      this.generateType(SitemapType.INDEX, () => this.buildIndexXml()),
    ]);
  }

  async getBrandsXml(): Promise<string> {
    const brands = await this.prisma.seoPage.findMany({
      where: { pageType: 'BRAND', indexable: true },
      select: { path: true, updatedAt: true },
      take: 5000,
    });
    const urls = brands.map((b) => ({
      loc: absoluteUrl(b.path, this.siteUrl),
      lastmod: b.updatedAt.toISOString(),
    }));
    return this.wrapUrlset(urls);
  }

  async getXml(type: SitemapType): Promise<string> {
    const row = await this.prisma.sitemapIndex.findUnique({ where: { sitemapType: type } });
    if (row?.xmlContent) return row.xmlContent;
    await this.generateAll();
    const refreshed = await this.prisma.sitemapIndex.findUnique({ where: { sitemapType: type } });
    return refreshed?.xmlContent ?? this.emptyUrlset();
  }

  private async generateType(type: SitemapType, builder: () => Promise<{ xml: string; count: number }>) {
    const { xml, count } = await builder();
    const fileName = type === SitemapType.INDEX ? 'sitemap.xml' : `sitemap-${type.toLowerCase()}.xml`;
    await this.prisma.sitemapIndex.upsert({
      where: { sitemapType: type },
      create: {
        sitemapType: type,
        url: absoluteUrl(`/${fileName}`, this.siteUrl),
        lastGeneratedAt: new Date(),
        urlCount: count,
        xmlContent: xml,
      },
      update: {
        url: absoluteUrl(`/${fileName}`, this.siteUrl),
        lastGeneratedAt: new Date(),
        urlCount: count,
        xmlContent: xml,
      },
    });
  }

  private async buildIndexXml() {
    const children = ['static', 'products', 'stores', 'categories', 'cities', 'faq', 'brands'];
    const urls = children.map((c) => ({
      loc: absoluteUrl(`/sitemap-${c}.xml`, this.siteUrl),
      lastmod: new Date().toISOString(),
    }));
    return { xml: this.wrapSitemapIndex(urls), count: urls.length };
  }

  /** Static, evergreen pages. Computed on the fly (not DB-cached), like brands. */
  getStaticXml(): string {
    const lastmod = new Date().toISOString();
    const urls = STATIC_PATHS.map((path) => ({
      loc: absoluteUrl(path, this.siteUrl),
      lastmod,
    }));
    return this.wrapUrlset(urls);
  }

  private async buildProductsXml() {
    // NOTE: capped at SITEMAP_MAX_URLS so a single file stays well under the
    // 50,000-URL / 50MB sitemap limit. If the catalogue outgrows this, split
    // into paginated children (sitemap-products-1.xml, …) referenced by the
    // index. Products are keyed by their canonical /products/{id} — no
    // seller/store query params, so there are no parameterised duplicates.
    const products = await this.prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, updatedAt: true, imageUrls: true },
      take: SITEMAP_MAX_URLS,
      orderBy: { updatedAt: 'desc' },
    });
    const urls = products.map((p) => ({
      loc: absoluteUrl(`/products/${p.id}`, this.siteUrl),
      lastmod: p.updatedAt.toISOString(),
      images: (p.imageUrls ?? []).slice(0, 5),
    }));
    return { xml: this.wrapUrlset(urls), count: urls.length };
  }

  private async buildStoresXml() {
    // Canonical store URL is /store/{slug} only (the legacy /stores/{slug}
    // permanently redirects, so it must never be emitted here).
    const stores = await this.prisma.store.findMany({
      where: { isActive: true, deletedAt: null, status: 'APPROVED' },
      select: { slug: true, updatedAt: true, logoUrl: true, bannerUrl: true },
      take: SITEMAP_MAX_URLS,
    });
    const urls = stores.map((s) => ({
      loc: absoluteUrl(`/store/${s.slug}`, this.siteUrl),
      lastmod: s.updatedAt.toISOString(),
      images: [s.bannerUrl, s.logoUrl].filter((u): u is string => Boolean(u)),
    }));
    return { xml: this.wrapUrlset(urls), count: urls.length };
  }

  private async buildCategoriesXml() {
    // Canonical category URL is /categories/{slug} only (legacy /category/{slug}
    // permanently redirects).
    const categories = await this.prisma.category.findMany({
      where: { isActive: true, deletedAt: null, scope: 'GLOBAL', storeId: null },
      select: { slug: true, updatedAt: true },
      take: 2000,
    });
    const urls = categories.map((c) => ({
      loc: absoluteUrl(`/categories/${c.slug}`, this.siteUrl),
      lastmod: c.updatedAt.toISOString(),
    }));
    return { xml: this.wrapUrlset(urls), count: urls.length };
  }

  private async buildCitiesXml() {
    const [cities, pages] = await Promise.all([
      this.prisma.city.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      this.prisma.seoPage.findMany({
        where: { pageType: { in: ['CITY', 'CITY_CATEGORY'] }, indexable: true },
        select: { path: true, updatedAt: true },
      }),
    ]);
    const urls = [
      ...cities.map((c) => ({
        loc: absoluteUrl(`/city/${c.slug}`, this.siteUrl),
        lastmod: c.updatedAt.toISOString(),
      })),
      ...pages.map((p) => ({
        loc: absoluteUrl(p.path, this.siteUrl),
        lastmod: p.updatedAt.toISOString(),
      })),
    ];
    return { xml: this.wrapUrlset(urls), count: urls.length };
  }

  private async buildFaqXml() {
    const faqs = await this.prisma.seoFaq.findMany({ select: { slug: true, updatedAt: true }, take: 500 });
    const urls = [
      { loc: absoluteUrl('/faq', this.siteUrl), lastmod: new Date().toISOString() },
      ...faqs.map((f) => ({
        loc: absoluteUrl(`/faq#${f.slug}`, this.siteUrl),
        lastmod: f.updatedAt.toISOString(),
      })),
    ];
    return { xml: this.wrapUrlset(urls), count: urls.length };
  }

  private wrapUrlset(urls: Array<{ loc: string; lastmod: string; images?: string[] }>) {
    const body = urls
      .map((u) => {
        const images = (u.images ?? [])
          .filter((img) => Boolean(img && img.trim()))
          .map((img) => `<image:image><image:loc>${this.escape(img)}</image:loc></image:image>`)
          .join('');
        return `  <url><loc>${this.escape(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><changefreq>daily</changefreq><priority>0.8</priority>${images}</url>`;
      })
      .join('\n');
    return (
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
      `xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>`
    );
  }

  private wrapSitemapIndex(urls: Array<{ loc: string; lastmod: string }>) {
    const body = urls
      .map((u) => `  <sitemap><loc>${this.escape(u.loc)}</loc><lastmod>${u.lastmod}</lastmod></sitemap>`)
      .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`;
  }

  private emptyUrlset() {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
  }

  private escape(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
