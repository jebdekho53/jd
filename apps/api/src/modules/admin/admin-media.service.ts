import { Injectable } from '@nestjs/common';
import { CategoryScope } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminMediaService {
  constructor(private readonly prisma: PrismaService) {}

  async getCoverageReport() {
    const [productsMissing, storesMissingLogo, storesMissingBanner, categoriesMissing] =
      await Promise.all([
        this.prisma.product.findMany({
          where: {
            deletedAt: null,
            OR: [{ imageUrls: { equals: [] } }, { imageUrls: { isEmpty: true } }],
          },
          select: {
            id: true,
            name: true,
            storeId: true,
            isActive: true,
            store: { select: { name: true } },
          },
          take: 200,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.store.findMany({
          where: { deletedAt: null, logoUrl: null },
          select: { id: true, name: true, status: true },
          take: 200,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.store.findMany({
          where: { deletedAt: null, bannerUrl: null },
          select: { id: true, name: true, status: true },
          take: 200,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.category.findMany({
          where: {
            deletedAt: null,
            scope: CategoryScope.GLOBAL,
            storeId: null,
            imageUrl: null,
          },
          select: {
            id: true,
            name: true,
            parentId: true,
            isActive: true,
            parent: { select: { name: true } },
          },
          take: 200,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    const [
      productCount,
      storeLogoCount,
      storeBannerCount,
      categoryCount,
    ] = await Promise.all([
      this.prisma.product.count({
        where: {
          deletedAt: null,
          OR: [{ imageUrls: { equals: [] } }, { imageUrls: { isEmpty: true } }],
        },
      }),
      this.prisma.store.count({ where: { deletedAt: null, logoUrl: null } }),
      this.prisma.store.count({ where: { deletedAt: null, bannerUrl: null } }),
      this.prisma.category.count({
        where: {
          deletedAt: null,
          scope: CategoryScope.GLOBAL,
          storeId: null,
          imageUrl: null,
        },
      }),
    ]);

    return {
      totals: {
        productsWithoutImages: productCount,
        storesWithoutLogo: storeLogoCount,
        storesWithoutBanner: storeBannerCount,
        categoriesWithoutImages: categoryCount,
      },
      samples: {
        products: productsMissing,
        storesMissingLogo,
        storesMissingBanner,
        categories: categoriesMissing,
      },
    };
  }
}
