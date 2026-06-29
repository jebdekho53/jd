import {
  CategoryCatalogKind,
  CategoryScope,
  PrismaClient,
} from '@prisma/client';
import { MENU_CATALOG, type MenuCatalogNode } from './catalog';

export type MenuCatalogSeedStats = {
  parentsCreated: number;
  parentsUpdated: number;
  parentsSkipped: number;
  childrenCreated: number;
  childrenUpdated: number;
  childrenSkipped: number;
};

type CategoryRow = {
  id: string;
  slug: string;
  catalogKind: CategoryCatalogKind;
  parentId: string | null;
};

export type MenuCatalogPrisma = Pick<
  PrismaClient,
  'category'
>;

function emptyStats(): MenuCatalogSeedStats {
  return {
    parentsCreated: 0,
    parentsUpdated: 0,
    parentsSkipped: 0,
    childrenCreated: 0,
    childrenUpdated: 0,
    childrenSkipped: 0,
  };

}

async function findGlobalCategory(
  prisma: MenuCatalogPrisma,
  slug: string,
  parentId: string | null,
): Promise<CategoryRow | null> {
  return prisma.category.findFirst({
    where: {
      slug,
      storeId: null,
      parentId,
      scope: CategoryScope.GLOBAL,
      deletedAt: null,
    },
    select: { id: true, slug: true, catalogKind: true, parentId: true },
  });
}

async function upsertMenuParent(
  prisma: MenuCatalogPrisma,
  node: MenuCatalogNode,
  stats: MenuCatalogSeedStats,
): Promise<string | null> {
  const existing = await findGlobalCategory(prisma, node.slug, null);

  if (existing?.catalogKind === CategoryCatalogKind.PRODUCT) {
    stats.parentsSkipped += 1;
    return null;
  }

  if (!existing) {
    const created = await prisma.category.create({
      data: {
        name: node.name,
        slug: node.slug,
        sortOrder: node.sortOrder,
        scope: CategoryScope.GLOBAL,
        catalogKind: CategoryCatalogKind.MENU,
        isActive: true,
      },
      select: { id: true },
    });
    stats.parentsCreated += 1;
    return created.id;
  }

  await prisma.category.update({
    where: { id: existing.id },
    data: {
      name: node.name,
      sortOrder: node.sortOrder,
      catalogKind: CategoryCatalogKind.MENU,
      isActive: true,
      deletedAt: null,
    },
  });
  stats.parentsUpdated += 1;
  return existing.id;
}

async function upsertMenuChild(
  prisma: MenuCatalogPrisma,
  parentId: string,
  node: MenuCatalogNode,
  stats: MenuCatalogSeedStats,
): Promise<void> {
  const existing = await findGlobalCategory(prisma, node.slug, parentId);

  if (existing?.catalogKind === CategoryCatalogKind.PRODUCT) {
    stats.childrenSkipped += 1;
    return;
  }

  if (!existing) {
    await prisma.category.create({
      data: {
        name: node.name,
        slug: node.slug,
        parentId,
        sortOrder: node.sortOrder,
        scope: CategoryScope.GLOBAL,
        catalogKind: CategoryCatalogKind.MENU,
        isActive: true,
      },
    });
    stats.childrenCreated += 1;
    return;
  }

  await prisma.category.update({
    where: { id: existing.id },
    data: {
      name: node.name,
      sortOrder: node.sortOrder,
      parentId,
      catalogKind: CategoryCatalogKind.MENU,
      isActive: true,
      deletedAt: null,
    },
  });
  stats.childrenUpdated += 1;
}

export async function upsertMenuCatalog(
  prisma: MenuCatalogPrisma,
  catalog: MenuCatalogNode[] = MENU_CATALOG,
): Promise<MenuCatalogSeedStats> {
  const stats = emptyStats();

  for (const parent of catalog) {
    const parentId = await upsertMenuParent(prisma, parent, stats);
    if (!parentId) continue;

    for (const child of parent.children ?? []) {
      await upsertMenuChild(prisma, parentId, child, stats);
    }
  }

  return stats;
}

/** Collect all slugs in catalog tree — used by tests to assert uniqueness. */
export function collectMenuCatalogSlugs(catalog: MenuCatalogNode[] = MENU_CATALOG): string[] {
  const slugs: string[] = [];
  for (const parent of catalog) {
    slugs.push(parent.slug);
    for (const child of parent.children ?? []) {
      slugs.push(child.slug);
    }
  }
  return slugs;
}

export function assertMenuCatalogSlugUniqueness(catalog: MenuCatalogNode[] = MENU_CATALOG): void {
  const slugs = collectMenuCatalogSlugs(catalog);
  const seen = new Set<string>();
  for (const slug of slugs) {
    if (seen.has(slug)) {
      throw new Error(`Duplicate menu catalog slug: ${slug}`);
    }
    seen.add(slug);
  }
}
