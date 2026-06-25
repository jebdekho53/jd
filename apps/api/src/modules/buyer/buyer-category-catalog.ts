import { CategoryScope, Prisma, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { CategoryItem } from './buyer-product.service';

/** Active global taxonomy rows — same visibility rules as admin catalog. */
export const ACTIVE_GLOBAL_CATEGORY_WHERE: Prisma.CategoryWhereInput = {
  parentId: null,
  isActive: true,
  deletedAt: null,
  storeId: null,
  scope: CategoryScope.GLOBAL,
};

const categoryInclude = {
  children: {
    where: { isActive: true, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      parentId: true,
      sortOrder: true,
    },
    orderBy: { sortOrder: 'asc' as const },
  },
} satisfies Prisma.CategoryInclude;

type CategoryRow = Prisma.CategoryGetPayload<{ include: typeof categoryInclude }>;

const PRODUCT_VISIBLE_WHERE: Prisma.ProductWhereInput = {
  isActive: true,
  deletedAt: null,
  variants: {
    some: {
      isActive: true,
      inventory: { availableQty: { gt: 0 } },
    },
  },
};

function mapRows(rows: CategoryRow[]): CategoryItem[] {
  return rows.map((c) => ({
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

/** Load the full admin-managed global category tree for buyer navigation/filters. */
export async function fetchActiveGlobalCategories(
  prisma: PrismaService,
): Promise<CategoryItem[]> {
  const rows = await prisma.category.findMany({
    where: ACTIVE_GLOBAL_CATEGORY_WHERE,
    include: categoryInclude,
    orderBy: { sortOrder: 'asc' },
  });
  return mapRows(rows);
}

/**
 * Store-scoped buyer categories: only approved subcategories with active in-stock products.
 */
export async function fetchStoreVisibleCategories(
  prisma: PrismaService,
  storeId: string,
): Promise<CategoryItem[]> {
  const products = await prisma.product.findMany({
    where: { storeId, ...PRODUCT_VISIBLE_WHERE, categoryId: { not: null } },
    select: { categoryId: true },
  });

  const leafIds = [...new Set(products.map((p) => p.categoryId!).filter(Boolean))];
  if (leafIds.length === 0) return [];

  const leafCategories = await prisma.category.findMany({
    where: {
      id: { in: leafIds },
      isActive: true,
      deletedAt: null,
      storeId: null,
      scope: CategoryScope.GLOBAL,
    },
    select: { id: true, parentId: true },
  });

  const approved = await prisma.storeCategory.findMany({
    where: { storeId },
    select: { categoryId: true, subcategoryId: true },
  });
  const approvedKeys = new Set(
    approved.map((a) => `${a.categoryId}:${a.subcategoryId}`),
  );

  const visibleSubIds = new Set<string>();
  const visibleParentIds = new Set<string>();

  for (const leaf of leafCategories) {
    if (leaf.parentId) {
      const key = `${leaf.parentId}:${leaf.id}`;
      if (approvedKeys.has(key)) {
        visibleSubIds.add(leaf.id);
        visibleParentIds.add(leaf.parentId);
      }
    } else if (approved.some((a) => a.categoryId === leaf.id)) {
      visibleParentIds.add(leaf.id);
    }
  }

  if (visibleSubIds.size === 0 && visibleParentIds.size === 0) return [];

  const rows = await prisma.category.findMany({
    where: {
      ...ACTIVE_GLOBAL_CATEGORY_WHERE,
      id: { in: [...visibleParentIds] },
    },
    include: {
      children: {
        where: {
          isActive: true,
          deletedAt: null,
          id: { in: [...visibleSubIds] },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          parentId: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  return mapRows(rows.filter((r) => r.children.length > 0 || visibleParentIds.has(r.id)));
}

/** Approved subcategory IDs for a store (StoreCategory grants). */
export async function fetchApprovedSubcategoryIds(
  prisma: PrismaService,
  storeId: string,
): Promise<string[]> {
  const rows = await prisma.storeCategory.findMany({
    where: { storeId },
    select: { subcategoryId: true },
  });
  return rows.map((r) => r.subcategoryId);
}

/** Stores selling in a category/subcategory with approved grants and visible stock. */
export async function fetchStoresForCategory(
  prisma: PrismaService,
  categoryId: string,
  subcategoryId?: string,
): Promise<{ storeId: string; productCount: number }[]> {
  const grants = await prisma.storeCategory.findMany({
    where: subcategoryId ? { subcategoryId } : { categoryId },
    select: { storeId: true, subcategoryId: true },
  });

  if (grants.length === 0) return [];

  const storeIds = [...new Set(grants.map((g) => g.storeId))];
  const approvedSubIds = subcategoryId
    ? [subcategoryId]
    : [...new Set(grants.map((g) => g.subcategoryId))];

  const counts = await prisma.product.groupBy({
    by: ['storeId'],
    where: {
      storeId: { in: storeIds },
      categoryId: { in: approvedSubIds },
      ...PRODUCT_VISIBLE_WHERE,
      store: {
        status: StoreStatus.APPROVED,
        isActive: true,
        deletedAt: null,
      },
    },
    _count: { id: true },
  });

  return counts
    .map((c) => ({ storeId: c.storeId, productCount: c._count.id }))
    .filter((c) => c.productCount > 0);
}

/** Validate that a category id refers to an active global catalog row (parent or child). */
export async function assertActiveGlobalCategory(
  prisma: PrismaService,
  categoryId: string,
): Promise<void> {
  const cat = await prisma.category.findFirst({
    where: {
      id: categoryId,
      isActive: true,
      deletedAt: null,
      storeId: null,
      scope: CategoryScope.GLOBAL,
    },
    select: { id: true, parentId: true },
  });
  if (!cat) {
    throw new Error('Category is not available');
  }
  if (cat.parentId) {
    const parent = await prisma.category.findFirst({
      where: {
        id: cat.parentId,
        isActive: true,
        deletedAt: null,
        storeId: null,
        scope: CategoryScope.GLOBAL,
      },
      select: { id: true },
    });
    if (!parent) {
      throw new Error('Category is not available');
    }
  }
}
