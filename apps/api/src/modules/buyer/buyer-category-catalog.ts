import { CategoryScope, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { CategoryItem } from './buyer-product.service';
import { PRODUCT_VISIBLE_WHERE, STORE_VISIBLE_WHERE } from './buyer-visibility.util';

export type CategoryGrantScope = {
  parentCategoryId: string;
  subcategoryIds: string[];
};

/** Active global taxonomy rows — same visibility rules as admin catalog. */
export const ACTIVE_GLOBAL_CATEGORY_WHERE: Prisma.CategoryWhereInput = {
  parentId: null,
  isActive: true,
  deletedAt: null,
  storeId: null,
  scope: CategoryScope.GLOBAL,
};

/** Taxonomy is a single-parent tree capped at 3 levels (root → sub → leaf). */
const CATEGORY_TREE_ORDER: Prisma.CategoryOrderByWithRelationInput[] = [
  { sortOrder: 'asc' },
  { name: 'asc' },
];

const grandchildSelect = {
  id: true,
  name: true,
  slug: true,
  imageUrl: true,
  parentId: true,
  sortOrder: true,
} as const;

const categoryInclude = {
  children: {
    where: { isActive: true, deletedAt: null },
    select: {
      ...grandchildSelect,
      // Third level (leaf) — required so level-2 category pages can render their children.
      children: {
        where: { isActive: true, deletedAt: null },
        select: grandchildSelect,
        orderBy: CATEGORY_TREE_ORDER,
      },
    },
    orderBy: CATEGORY_TREE_ORDER,
  },
} satisfies Prisma.CategoryInclude;

/**
 * Structural row shape accepted by {@link mapRows}. Grandchildren are optional so the
 * same mapper serves both the full 3-level global tree and the 2-level store-visible
 * tree (which derives children from in-stock products and has no third level).
 */
type CategoryNodeRow = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
};
type CategoryRow = CategoryNodeRow & {
  children: (CategoryNodeRow & { children?: CategoryNodeRow[] })[];
};

const GLOBAL_CATEGORY_SELECT = {
  id: true,
  parentId: true,
} as const;

/**
 * Resolve whether :categoryId is a parent or leaf (subcategory).
 * Buyer category pages pass the slug-matched category id directly — often a subcategory
 * such as "Dairy & Bakery" — so grants must match StoreCategory.subcategoryId, not categoryId.
 */
export async function resolveCategoryGrantScope(
  prisma: PrismaService,
  categoryId: string,
  explicitSubcategoryId?: string,
): Promise<CategoryGrantScope | null> {
  if (explicitSubcategoryId) {
    const sub = await prisma.category.findFirst({
      where: {
        id: explicitSubcategoryId,
        isActive: true,
        deletedAt: null,
        storeId: null,
        scope: CategoryScope.GLOBAL,
      },
      select: GLOBAL_CATEGORY_SELECT,
    });
    if (!sub?.parentId) return null;
    return { parentCategoryId: sub.parentId, subcategoryIds: [explicitSubcategoryId] };
  }

  const cat = await prisma.category.findFirst({
    where: {
      id: categoryId,
      isActive: true,
      deletedAt: null,
      storeId: null,
      scope: CategoryScope.GLOBAL,
    },
    select: GLOBAL_CATEGORY_SELECT,
  });
  if (!cat) return null;

  if (cat.parentId) {
    return { parentCategoryId: cat.parentId, subcategoryIds: [cat.id] };
  }

  return { parentCategoryId: cat.id, subcategoryIds: [] };
}

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
      children:
        Array.isArray(ch.children)
          ? ch.children.map((gc) => ({
              id: gc.id,
              name: gc.name,
              slug: gc.slug,
              imageUrl: gc.imageUrl,
              parentId: gc.parentId,
              sortOrder: gc.sortOrder,
              children: [],
            }))
          : [],
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
    orderBy: CATEGORY_TREE_ORDER,
  });
  return mapRows(rows);
}

/**
 * Store-scoped buyer categories: derived from in-stock products (not manual store-category grants).
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

  const visibleSubIds = new Set<string>();
  const visibleParentIds = new Set<string>();

  for (const leaf of leafCategories) {
    if (leaf.parentId) {
      visibleSubIds.add(leaf.id);
      visibleParentIds.add(leaf.parentId);
    } else {
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
        orderBy: CATEGORY_TREE_ORDER,
      },
    },
    orderBy: CATEGORY_TREE_ORDER,
  });

  return mapRows(rows.filter((r) => r.children.length > 0 || visibleParentIds.has(r.id)));
}

/** Approved subcategory IDs for a store (StoreCategory grants — merchant governance). */
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

/** Resolve category IDs that in-stock products may belong to for buyer category pages. */
async function resolveProductCategoryIds(
  prisma: PrismaService,
  scope: CategoryGrantScope,
): Promise<string[]> {
  if (scope.subcategoryIds.length > 0) {
    return scope.subcategoryIds;
  }

  const children = await prisma.category.findMany({
    where: {
      parentId: scope.parentCategoryId,
      isActive: true,
      deletedAt: null,
      storeId: null,
      scope: CategoryScope.GLOBAL,
    },
    select: { id: true },
  });

  const ids = children.map((c) => c.id);
  // Include parent id for products tagged at parent level (legacy data)
  ids.push(scope.parentCategoryId);
  return ids;
}

/**
 * Stores selling in a category: product-first (in-stock products drive store inclusion).
 * A store appears because it sells visible products in the category, not because of
 * a manual StoreCategory grant alone.
 */
export async function fetchStoresForCategory(
  prisma: PrismaService,
  categoryId: string,
  subcategoryId?: string,
): Promise<{ storeId: string; productCount: number }[]> {
  const scope = await resolveCategoryGrantScope(prisma, categoryId, subcategoryId);
  if (!scope) return [];

  const categoryIdsForProducts = await resolveProductCategoryIds(prisma, scope);
  if (categoryIdsForProducts.length === 0) return [];

  const counts = await prisma.product.groupBy({
    by: ['storeId'],
    where: {
      categoryId: { in: categoryIdsForProducts },
      ...PRODUCT_VISIBLE_WHERE,
      store: STORE_VISIBLE_WHERE,
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
