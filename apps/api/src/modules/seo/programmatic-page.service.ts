import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CategoryScope, SeoPageType, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { absoluteUrl, slugify } from './seo.util';

@Injectable()
export class ProgrammaticPageService {
  private readonly siteUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.siteUrl = config.get<string>('BUYER_SITE_URL', 'https://jebdekho.com');
  }

  async syncAll(): Promise<number> {
    let count = 0;
    count += await this.syncCityPages();
    count += await this.syncCityCategoryPages();
    count += await this.syncStorePages();
    count += await this.syncCategoryPages();
    count += await this.syncBrandPages();
    return count;
  }

  async getPageByPath(path: string) {
    return this.prisma.seoPage.findUnique({
      where: { path },
      include: { city: true, category: true, store: true, faqs: { where: { featured: true }, take: 10 } },
    });
  }

  private async upsertPage(data: {
    slug: string;
    path: string;
    pageType: SeoPageType;
    title: string;
    description: string;
    h1: string;
    cityId?: string;
    categoryId?: string;
    storeId?: string;
    brandSlug?: string;
    entityType?: string;
    entityId?: string;
  }) {
    return this.prisma.seoPage.upsert({
      where: { path: data.path },
      create: {
        ...data,
        canonicalUrl: absoluteUrl(data.path, this.siteUrl),
        indexable: true,
      },
      update: {
        title: data.title,
        description: data.description,
        h1: data.h1,
        canonicalUrl: absoluteUrl(data.path, this.siteUrl),
        indexable: true,
      },
    });
  }

  private async syncCityPages() {
    const cities = await this.prisma.city.findMany({ where: { isActive: true } });
    for (const city of cities) {
      const path = `/city/${city.slug}`;
      await this.upsertPage({
        slug: `city-${city.slug}`,
        path,
        pageType: SeoPageType.CITY,
        title: `Hyperlocal delivery in ${city.name} | JebDekho`,
        description: `Order groceries, essentials, and more with fast delivery in ${city.name}, ${city.state}. Discover local stores on JebDekho.`,
        h1: `Delivery in ${city.name}`,
        cityId: city.id,
        entityType: 'city',
        entityId: city.id,
      });
    }
    return cities.length;
  }

  private async syncCityCategoryPages() {
    const cities = await this.prisma.city.findMany({ where: { isActive: true } });
    const categories = await this.prisma.category.findMany({
      where: { isActive: true, deletedAt: null, scope: CategoryScope.GLOBAL, storeId: null },
      take: 200,
    });
    let count = 0;
    for (const city of cities) {
      for (const cat of categories) {
        const path = `/city/${city.slug}/${cat.slug}`;
        await this.upsertPage({
          slug: `city-${city.slug}-${cat.slug}`,
          path,
          pageType: SeoPageType.CITY_CATEGORY,
          title: `${cat.name} delivery in ${city.name} | JebDekho`,
          description: `Buy ${cat.name} online in ${city.name} with fast hyperlocal delivery from trusted local stores.`,
          h1: `${cat.name} in ${city.name}`,
          cityId: city.id,
          categoryId: cat.id,
          entityType: 'city_category',
          entityId: `${city.id}:${cat.id}`,
        });
        count++;
      }
    }
    return count;
  }

  private async syncStorePages() {
    const stores = await this.prisma.store.findMany({
      where: { isActive: true, deletedAt: null, status: StoreStatus.APPROVED },
      include: { city: true },
      take: 2000,
    });
    for (const store of stores) {
      const path = `/store/${store.slug}`;
      await this.upsertPage({
        slug: `store-${store.slug}`,
        path,
        pageType: SeoPageType.STORE,
        title: `${store.name} — Order online | JebDekho`,
        description: `Order from ${store.name} in ${store.city?.name ?? 'your city'} with fast delivery on JebDekho.`,
        h1: store.name,
        storeId: store.id,
        cityId: store.cityId,
        entityType: 'store',
        entityId: store.id,
      });
    }
    return stores.length;
  }

  private async syncCategoryPages() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true, deletedAt: null, scope: CategoryScope.GLOBAL, storeId: null },
    });
    for (const cat of categories) {
      const path = `/category/${cat.slug}`;
      await this.upsertPage({
        slug: `category-${cat.slug}`,
        path,
        pageType: SeoPageType.CATEGORY,
        title: `Shop ${cat.name} online | JebDekho`,
        description: cat.description ?? `Browse ${cat.name} from hyperlocal stores near you on JebDekho.`,
        h1: cat.name,
        categoryId: cat.id,
        entityType: 'category',
        entityId: cat.id,
      });
    }
    return categories.length;
  }

  private async syncBrandPages() {
    const brands = await this.prisma.product.groupBy({
      by: ['brand'],
      where: { isActive: true, deletedAt: null, brand: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 500,
    });
    let count = 0;
    for (const row of brands) {
      if (!row.brand) continue;
      const brandSlug = slugify(row.brand);
      const path = `/brand/${brandSlug}`;
      await this.upsertPage({
        slug: `brand-${brandSlug}`,
        path,
        pageType: SeoPageType.BRAND,
        title: `${row.brand} products | JebDekho`,
        description: `Shop ${row.brand} products from local stores with fast delivery on JebDekho.`,
        h1: row.brand,
        brandSlug,
        entityType: 'brand',
        entityId: brandSlug,
      });
      count++;
    }
    return count;
  }
}
