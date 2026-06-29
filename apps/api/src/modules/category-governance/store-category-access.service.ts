import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import {
  CategoryCatalogKind,
  CategoryScope,
  MerchantCategoryStatus,
  StoreCategoryRequestStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export type ApprovedCategoryTree = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  children: ApprovedCategoryTree[];
};

@Injectable()
export class StoreCategoryAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertMenuSubcategoryApproved(
    storeId: string,
    merchantProfileId: string,
    platformSubcategoryId: string,
  ): Promise<{ parentId: string; subcategoryId: string; slug: string; name: string }> {
    const subcategory = await this.prisma.category.findFirst({
      where: {
        id: platformSubcategoryId,
        storeId: null,
        scope: CategoryScope.GLOBAL,
        catalogKind: CategoryCatalogKind.MENU,
        isActive: true,
        deletedAt: null,
        parentId: { not: null },
      },
      select: { id: true, parentId: true, slug: true, name: true },
    });
    if (!subcategory?.parentId) {
      throw new BadRequestException('Menu subcategory not found or is not a MENU catalog category');
    }
    await this.assertSubcategoryApproved(
      storeId,
      merchantProfileId,
      subcategory.parentId,
      subcategory.id,
    );
    return {
      parentId: subcategory.parentId,
      subcategoryId: subcategory.id,
      slug: subcategory.slug,
      name: subcategory.name,
    };
  }

  async assertProductCategoryAllowed(
    storeId: string,
    merchantProfileId: string,
    categoryId: string,
  ): Promise<void> {
    const cat = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        deletedAt: null,
        isActive: true,
        storeId: null,
        scope: CategoryScope.GLOBAL,
        catalogKind: CategoryCatalogKind.PRODUCT,
      },
      select: { id: true, parentId: true, name: true },
    });
    if (!cat) {
      throw new BadRequestException('Category not found or is not available');
    }

    if (cat.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: {
          id: cat.parentId,
          deletedAt: null,
          isActive: true,
          storeId: null,
          scope: CategoryScope.GLOBAL,
        },
      });
      if (!parent) {
        throw new BadRequestException('Parent category is not available');
      }
      await this.assertSubcategoryApproved(storeId, merchantProfileId, cat.parentId, categoryId);
      return;
    }

    await this.assertParentOrLegacyApproved(storeId, merchantProfileId, categoryId);
  }

  private async assertSubcategoryApproved(
    storeId: string,
    merchantProfileId: string,
    parentCategoryId: string,
    subcategoryId: string,
  ): Promise<void> {
    const storeApproval = await this.prisma.storeCategory.findUnique({
      where: {
        storeId_categoryId_subcategoryId: {
          storeId,
          categoryId: parentCategoryId,
          subcategoryId,
        },
      },
    });
    if (storeApproval) return;

    const approvedRequest = await this.prisma.storeCategoryRequest.findFirst({
      where: {
        storeId,
        categoryId: parentCategoryId,
        subcategoryId,
        status: StoreCategoryRequestStatus.APPROVED,
      },
    });
    if (approvedRequest) return;

    const legacy = await this.prisma.merchantCategory.findFirst({
      where: {
        merchantProfileId,
        categoryId: { in: [parentCategoryId, subcategoryId] },
        status: MerchantCategoryStatus.APPROVED,
      },
    });
    if (legacy) return;

    throw new ForbiddenException(
      'This store is not authorized to sell in this category. Request category access from Business Categories.',
    );
  }

  private async assertParentOrLegacyApproved(
    storeId: string,
    merchantProfileId: string,
    categoryId: string,
  ): Promise<void> {
    const storeApproval = await this.prisma.storeCategory.findFirst({
      where: { storeId, categoryId },
    });
    if (storeApproval) return;

    const legacy = await this.prisma.merchantCategory.findFirst({
      where: {
        merchantProfileId,
        categoryId,
        status: MerchantCategoryStatus.APPROVED,
      },
    });
    if (legacy) return;

    throw new ForbiddenException(
      'This store is not authorized to sell in this category. Request category access from Business Categories.',
    );
  }

  async listApprovedCategoryTree(
    storeId: string,
    catalogKind: CategoryCatalogKind = CategoryCatalogKind.PRODUCT,
  ): Promise<ApprovedCategoryTree[]> {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
      select: { merchantProfileId: true },
    });
    if (!store) return [];

    const storeRows = await this.prisma.storeCategory.findMany({
      where: { storeId },
      select: { categoryId: true, subcategoryId: true },
    });

    const approvedSubIds = new Set(storeRows.map((r) => r.subcategoryId));
    const approvedParentIds = new Set(storeRows.map((r) => r.categoryId));

    const approvedRequests = await this.prisma.storeCategoryRequest.findMany({
      where: { storeId, status: StoreCategoryRequestStatus.APPROVED },
      select: { categoryId: true, subcategoryId: true },
    });
    for (const row of approvedRequests) {
      approvedSubIds.add(row.subcategoryId);
      approvedParentIds.add(row.categoryId);
    }

    if (approvedSubIds.size === 0) {
      const legacy = await this.prisma.merchantCategory.findMany({
        where: {
          merchantProfileId: store.merchantProfileId,
          status: MerchantCategoryStatus.APPROVED,
        },
        select: { categoryId: true },
      });
      for (const row of legacy) {
        const cat = await this.prisma.category.findUnique({
          where: { id: row.categoryId },
          select: { id: true, parentId: true },
        });
        if (!cat) continue;
        if (cat.parentId) {
          approvedSubIds.add(cat.id);
          approvedParentIds.add(cat.parentId);
        } else {
          approvedParentIds.add(cat.id);
        }
      }
    }

    if (approvedSubIds.size === 0 && approvedParentIds.size === 0) return [];

    const categories = await this.prisma.category.findMany({
      where: {
        storeId: null,
        scope: CategoryScope.GLOBAL,
        catalogKind,
        isActive: true,
        deletedAt: null,
        OR: [
          { id: { in: [...approvedParentIds] } },
          { children: { some: { id: { in: [...approvedSubIds] }, deletedAt: null } } },
        ],
      },
      include: {
        children: {
          where: {
            isActive: true,
            deletedAt: null,
            id: { in: [...approvedSubIds] },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return categories
      .filter((c) => c.parentId === null && (approvedParentIds.has(c.id) || c.children.length > 0))
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        imageUrl: c.imageUrl,
        icon: c.icon,
        parentId: c.parentId,
        sortOrder: c.sortOrder,
        children: c.children.map((ch) => ({
          id: ch.id,
          name: ch.name,
          slug: ch.slug,
          imageUrl: ch.imageUrl,
          icon: ch.icon,
          parentId: ch.parentId,
          sortOrder: ch.sortOrder,
          children: [],
        })),
      }));
  }
}
