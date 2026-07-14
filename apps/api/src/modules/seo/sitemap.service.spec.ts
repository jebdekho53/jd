import { ConfigService } from '@nestjs/config';
import { SitemapService } from './sitemap.service';

const SITE = 'https://jebdekho.com';

function makeService(prisma: unknown): SitemapService {
  const config = { get: (_k: string, d?: string) => d ?? SITE } as unknown as ConfigService;
  // BUYER_SITE_URL default resolves to SITE via the fallback above.
  return new SitemapService(prisma as never, config);
}

/** Extract every <loc> in a <urlset> (ignores <image:loc>). */
function locs(xml: string): string[] {
  return [...xml.matchAll(/<url><loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

describe('SitemapService — canonical-only output', () => {
  it('emits only /store/{slug} for stores (never legacy /stores/)', async () => {
    const prisma = {
      store: {
        findMany: jest.fn().mockResolvedValue([
          { slug: 'sharma-store', updatedAt: new Date('2026-01-01'), logoUrl: `${SITE}/uploads/l.jpg`, bannerUrl: null },
          { slug: 'gupta-store', updatedAt: new Date('2026-01-02'), logoUrl: null, bannerUrl: null },
        ]),
      },
    };
    const svc = makeService(prisma);
    const { xml } = await (svc as unknown as { buildStoresXml(): Promise<{ xml: string }> }).buildStoresXml();
    const urls = locs(xml);

    expect(urls).toContain(`${SITE}/store/sharma-store`);
    expect(urls).toContain(`${SITE}/store/gupta-store`);
    expect(xml).not.toContain('/stores/'); // legacy route must never appear
    // image markup present for the store that has a logo
    expect(xml).toContain('<image:image><image:loc>https://jebdekho.com/uploads/l.jpg</image:loc></image:image>');
    // namespace declared
    expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    // no duplicate URLs
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('emits only /categories/{slug} for categories (never legacy /category/)', async () => {
    const prisma = {
      category: {
        findMany: jest.fn().mockResolvedValue([
          { slug: 'grocery', updatedAt: new Date('2026-01-01') },
          { slug: 'bakery', updatedAt: new Date('2026-01-02') },
        ]),
      },
    };
    const svc = makeService(prisma);
    const { xml } = await (svc as unknown as { buildCategoriesXml(): Promise<{ xml: string }> }).buildCategoriesXml();
    const urls = locs(xml);

    expect(urls).toEqual([`${SITE}/categories/grocery`, `${SITE}/categories/bakery`]);
    expect(xml).not.toMatch(/<loc>[^<]*\/category\//); // singular legacy route absent
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('emits products at canonical /products/{id} with no query params + image markup', async () => {
    const prisma = {
      product: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'p1', updatedAt: new Date('2026-01-01'), imageUrls: [`${SITE}/uploads/p1.jpg`] },
        ]),
      },
    };
    const svc = makeService(prisma);
    const { xml } = await (svc as unknown as { buildProductsXml(): Promise<{ xml: string }> }).buildProductsXml();
    const urls = locs(xml);

    expect(urls).toEqual([`${SITE}/products/p1`]);
    expect(xml).not.toContain('?store='); // no parameterised duplicate canonicals
    expect(xml).toContain('<image:loc>https://jebdekho.com/uploads/p1.jpg</image:loc>');
  });

  it('static sitemap lists canonical listing/content routes and no noindex routes', () => {
    const svc = makeService({});
    const xml = svc.getStaticXml();
    const urls = locs(xml);

    expect(urls).toContain(`${SITE}/`);
    expect(urls).toContain(`${SITE}/stores`);
    expect(urls).toContain(`${SITE}/categories`);
    expect(urls).not.toContain(`${SITE}/search`); // search is noindex
    expect(new Set(urls).size).toBe(urls.length);
  });
});
