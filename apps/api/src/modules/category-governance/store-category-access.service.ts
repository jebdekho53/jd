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

    // Approval is "by branch": the category itself, or any ancestor, being
    // approved lets the store sell the whole subtree beneath it.
    const chain = await this.categoryAncestorChain(categoryId);
    if (await this.isAnyCategoryApproved(storeId, merchantProfileId, chain)) return;

    throw new ForbiddenException(
      'This store is not authorized to sell in this category. Request category access from Business Categories.',
    );
  }

  /** [categoryId, ...ancestors up to the root]. */
  private async categoryAncestorChain(categoryId: string): Promise<string[]> {
    const chain: string[] = [];
    let current: string | null = categoryId;
    // Guard against cycles / runaway depth.
    for (let i = 0; current && i < 10; i++) {
      chain.push(current);
      const node: { parentId: string | null } | null = await this.prisma.category.findUnique({
        where: { id: current },
        select: { parentId: true },
      });
      current = node?.parentId ?? null;
    }
    return chain;
  }

  /** True if the store (or its merchant, legacy) is approved for any id in the chain. */
  private async isAnyCategoryApproved(
    storeId: string,
    merchantProfileId: string,
    categoryIds: string[],
  ): Promise<boolean> {
    if (categoryIds.length === 0) return false;

    const [storeApproval, approvedRequest, legacy] = await Promise.all([
      this.prisma.storeCategory.findFirst({
        where: { storeId, OR: [{ categoryId: { in: categoryIds } }, { subcategoryId: { in: categoryIds } }] },
        select: { id: true },
      }),
      this.prisma.storeCategoryRequest.findFirst({
        where: {
          storeId,
          status: StoreCategoryRequestStatus.APPROVED,
          OR: [{ categoryId: { in: categoryIds } }, { subcategoryId: { in: categoryIds } }],
        },
        select: { id: true },
      }),
      this.prisma.merchantCategory.findFirst({
        where: {
          merchantProfileId,
          status: MerchantCategoryStatus.APPROVED,
          categoryId: { in: categoryIds },
        },
        select: { id: true },
      }),
    ]);
    return Boolean(storeApproval || approvedRequest || legacy);
  }

  private async assertSubcategoryApproved(
    storeId: string,
    merchantProfileId: string,
    parentCategoryId: string,
    subcategoryId: string,
  ): Promise<void> {
    // Approval is by-branch, exactly as for products and as listApprovedCategoryTree
    // already reports it: a store approved for "Bakery" may use Cakes, Pastry, etc.
    // The old exact parent+child pair lookup rejected every child of an approved
    // root, so a merchant could see menu subcategories they could never create.
    const chain = await this.categoryAncestorChain(subcategoryId);
    if (!chain.includes(parentCategoryId)) chain.push(parentCategoryId);
    if (await this.isAnyCategoryApproved(storeId, merchantProfileId, chain)) return;

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

    // The exact nodes the store is approved for (any depth). Access is by-branch,
    // so each granted node makes its whole subtree sellable.
    const grantedIds = new Set<string>();
    const storeRows = await this.prisma.storeCategory.findMany({
      where: { storeId },
      select: { subcategoryId: true },
    });
    storeRows.forEach((r) => grantedIds.add(r.subcategoryId));

    const approvedRequests = await this.prisma.storeCategoryRequest.findMany({
      where: { storeId, status: StoreCategoryRequestStatus.APPROVED },
      select: { subcategoryId: true },
    });
    approvedRequests.forEach((r) => grantedIds.add(r.subcategoryId));

    if (grantedIds.size === 0) {
      const legacy = await this.prisma.merchantCategory.findMany({
        where: { merchantProfileId: store.merchantProfileId, status: MerchantCategoryStatus.APPROVED },
        select: { categoryId: true },
      });
      legacy.forEach((r) => grantedIds.add(r.categoryId));
    }
    if (grantedIds.size === 0) return [];

    // Build the full GLOBAL tree of this kind, then return the subtree rooted at
    // each granted node — dropping any granted node that sits beneath another
    // granted node (its subtree is already covered).
    const all = await this.prisma.category.findMany({
      where: { storeId: null, scope: CategoryScope.GLOBAL, catalogKind, isActive: true, deletedAt: null },
      select: { id: true, name: true, slug: true, imageUrl: true, icon: true, parentId: true, sortOrder: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const map = new Map<string, ApprovedCategoryTree>(all.map((c) => [c.id, { ...c, children: [] }]));
    for (const node of map.values()) {
      const parent = node.parentId ? map.get(node.parentId) : null;
      if (parent) parent.children.push(node);
    }

    // Sellable = every granted node + its entire subtree.
    const sellable = new Set<string>();
    const markSubtree = (id: string) => {
      const n = map.get(id);
      if (!n || sellable.has(id)) return;
      sellable.add(id);
      n.children.forEach((c) => markSubtree(c.id));
    };
    grantedIds.forEach((id) => markSubtree(id));

    // Keep = sellable nodes + the ancestor path from each granted node up to its
    // root, so the returned tree stays grouped by vertical (Grocery › … › node).
    const keep = new Set(sellable);
    for (const id of grantedIds) {
      let cur = map.get(id)?.parentId ?? null;
      for (let i = 0; cur && i < 12; i++) {
        keep.add(cur);
        cur = map.get(cur)?.parentId ?? null;
      }
    }
    for (const node of map.values()) {
      node.children = node.children.filter((c) => keep.has(c.id));
    }
    return all
      .filter((c) => c.parentId === null && keep.has(c.id))
      .map((c) => map.get(c.id)!)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }
}
