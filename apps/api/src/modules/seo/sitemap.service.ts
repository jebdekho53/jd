import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SitemapType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { absoluteUrl } from './seo.util';

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
    const children = ['products', 'stores', 'categories', 'cities', 'faq'];
    const urls = children.map((c) => ({
      loc: absoluteUrl(`/sitemap-${c}.xml`, this.siteUrl),
      lastmod: new Date().toISOString(),
    }));
    return { xml: this.wrapSitemapIndex(urls), count: urls.length };
  }

  private async buildProductsXml() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, slug: true, updatedAt: true, store: { select: { slug: true } } },
      take: 5000,
      orderBy: { updatedAt: 'desc' },
    });
    const urls = products.map((p) => ({
      loc: absoluteUrl(`/products/${p.id}`, this.siteUrl),
      lastmod: p.updatedAt.toISOString(),
    }));
    return { xml: this.wrapUrlset(urls), count: urls.length };
  }

  private async buildStoresXml() {
    const stores = await this.prisma.store.findMany({
      where: { isActive: true, deletedAt: null, status: 'APPROVED' },
      select: { slug: true, updatedAt: true },
      take: 5000,
    });
    const urls = stores.flatMap((s) => [
      { loc: absoluteUrl(`/stores/${s.slug}`, this.siteUrl), lastmod: s.updatedAt.toISOString() },
      { loc: absoluteUrl(`/store/${s.slug}`, this.siteUrl), lastmod: s.updatedAt.toISOString() },
    ]);
    return { xml: this.wrapUrlset(urls), count: urls.length };
  }

  private async buildCategoriesXml() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true, deletedAt: null, scope: 'GLOBAL', storeId: null },
      select: { slug: true, updatedAt: true },
      take: 2000,
    });
    const urls = categories.flatMap((c) => [
      { loc: absoluteUrl(`/categories/${c.slug}`, this.siteUrl), lastmod: c.updatedAt.toISOString() },
      { loc: absoluteUrl(`/category/${c.slug}`, this.siteUrl), lastmod: c.updatedAt.toISOString() },
    ]);
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

  private wrapUrlset(urls: Array<{ loc: string; lastmod: string }>) {
    const body = urls
      .map(
        (u) =>
          `  <url><loc>${this.escape(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`,
      )
      .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
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
