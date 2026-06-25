import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { CategoryScope, MerchantCategoryStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export type ApprovedCategoryTree = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  children: ApprovedCategoryTree[];
};

@Injectable()
export class MerchantCategoryAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getApprovedCategoryIds(merchantProfileId: string): Promise<Set<string>> {
    const rows = await this.prisma.merchantCategory.findMany({
      where: { merchantProfileId, status: MerchantCategoryStatus.APPROVED },
      select: { categoryId: true },
    });
    return new Set(rows.map((r) => r.categoryId));
  }

  async assertCategoryApproved(
    merchantProfileId: string,
    categoryId: string,
  ): Promise<void> {
    const approved = await this.prisma.merchantCategory.findFirst({
      where: {
        merchantProfileId,
        categoryId,
        status: MerchantCategoryStatus.APPROVED,
      },
    });
    if (!approved) {
      throw new ForbiddenException(
        'You are not authorized to sell in this category. Request category access from Business Categories.',
      );
    }
  }

  /** Validates category is active, not deleted, and merchant has required approvals. */
  async assertProductCategoryAllowed(
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
      await this.assertCategoryApproved(merchantProfileId, cat.parentId);
    }

    await this.assertCategoryApproved(merchantProfileId, categoryId);
  }

  async listApprovedCategoryTree(
    merchantProfileId: string,
  ): Promise<ApprovedCategoryTree[]> {
    const approvedIds = await this.getApprovedCategoryIds(merchantProfileId);
    if (approvedIds.size === 0) return [];

    const categories = await this.prisma.category.findMany({
      where: {
        storeId: null,
        scope: CategoryScope.GLOBAL,
        isActive: true,
        deletedAt: null,
        OR: [
          { id: { in: [...approvedIds] } },
          { children: { some: { id: { in: [...approvedIds] }, deletedAt: null } } },
        ],
      },
      include: {
        children: {
          where: { isActive: true, deletedAt: null, id: { in: [...approvedIds] } },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return categories
      .filter((c) => c.parentId === null && approvedIds.has(c.id))
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        imageUrl: c.imageUrl,
        parentId: c.parentId,
        sortOrder: c.sortOrder,
        children: c.children.map((ch) => ({
          id: ch.id,
          name: ch.name,
          slug: ch.slug,
          imageUrl: ch.imageUrl,
          parentId: ch.parentId,
          sortOrder: ch.sortOrder,
          children: [],
        })),
      }));
  }
}
