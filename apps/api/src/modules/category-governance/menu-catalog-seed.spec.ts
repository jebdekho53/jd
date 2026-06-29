import { CategoryCatalogKind, CategoryScope } from '@prisma/client';
import { MENU_CATALOG } from '../../../../../prisma/data/menu-catalog/catalog';
import {
  assertMenuCatalogSlugUniqueness,
  collectMenuCatalogSlugs,
  upsertMenuCatalog,
  type MenuCatalogPrisma,
} from '../../../../../prisma/data/menu-catalog/upsert';

type StoredCategory = {
  id: string;
  slug: string;
  parentId: string | null;
  catalogKind: CategoryCatalogKind;
  name: string;
  sortOrder: number;
  scope: CategoryScope;
  isActive: boolean;
  deletedAt: Date | null;
};

function createMockPrisma() {
  const rows = new Map<string, StoredCategory>();
  let seq = 0;

  const prisma = {
    category: {
      findFirst: jest.fn(async (args: { where: Record<string, unknown> }) => {
        const { where } = args;
        for (const row of rows.values()) {
          if (row.deletedAt) continue;
          if (where.slug !== row.slug) continue;
          if (where.parentId !== row.parentId) continue;
          if (where.storeId !== null) continue;
          if (where.scope !== CategoryScope.GLOBAL) continue;
          return {
            id: row.id,
            slug: row.slug,
            catalogKind: row.catalogKind,
            parentId: row.parentId,
          };
        }
        return null;
      }),
      create: jest.fn(async (args: { data: Record<string, unknown> }) => {
        const { data } = args;
        const id = `cat-${++seq}`;
        rows.set(id, {
          id,
          slug: data.slug as string,
          parentId: (data.parentId as string | null) ?? null,
          catalogKind: data.catalogKind as CategoryCatalogKind,
          name: data.name as string,
          sortOrder: data.sortOrder as number,
          scope: CategoryScope.GLOBAL,
          isActive: true,
          deletedAt: null,
        });
        return { id };
      }),
      update: jest.fn(async (args: { where: { id: string }; data: Record<string, unknown> }) => {
        const { where, data } = args;
        const row = rows.get(where.id);
        if (!row) throw new Error('not found');
        rows.set(where.id, {
          ...row,
          name: (data.name as string | undefined) ?? row.name,
          sortOrder: (data.sortOrder as number | undefined) ?? row.sortOrder,
          catalogKind: (data.catalogKind as CategoryCatalogKind | undefined) ?? row.catalogKind,
          parentId: (data.parentId as string | null | undefined) ?? row.parentId,
          deletedAt: (data.deletedAt as Date | null | undefined) ?? row.deletedAt,
        });
        return rows.get(where.id);
      }),
    },
  } as unknown as MenuCatalogPrisma;

  return { prisma, rows };
}

describe('menu catalog seed', () => {
  it('catalog data has unique slugs', () => {
    expect(() => assertMenuCatalogSlugUniqueness(MENU_CATALOG)).not.toThrow();
    expect(collectMenuCatalogSlugs(MENU_CATALOG).length).toBe(42);
  });

  it('upsert is idempotent — second run creates nothing new', async () => {
    const { prisma, rows } = createMockPrisma();

    const first = await upsertMenuCatalog(prisma, MENU_CATALOG);
    const countAfterFirst = rows.size;

    const second = await upsertMenuCatalog(prisma, MENU_CATALOG);
    const countAfterSecond = rows.size;

    expect(first.parentsCreated).toBe(6);
    expect(first.childrenCreated).toBe(36);
    expect(countAfterFirst).toBe(42);
    expect(second.parentsCreated).toBe(0);
    expect(second.childrenCreated).toBe(0);
    expect(second.parentsUpdated).toBe(6);
    expect(second.childrenUpdated).toBe(36);
    expect(countAfterSecond).toBe(countAfterFirst);
  });

  it('does not modify existing PRODUCT catalog categories with the same slug under the same parent', async () => {
    const { prisma, rows } = createMockPrisma();

    const stats = await upsertMenuCatalog(prisma, [
      {
        name: 'Food',
        slug: 'menu-food-test',
        sortOrder: 1,
        children: [{ name: 'Biryani', slug: 'biryani', sortOrder: 1 }],
      },
    ]);

    const parentId = [...rows.values()].find((r) => r.slug === 'menu-food-test')?.id;
    expect(parentId).toBeDefined();

    rows.set('product-biryani', {
      id: 'product-biryani',
      slug: 'biryani',
      parentId: parentId!,
      catalogKind: CategoryCatalogKind.PRODUCT,
      name: 'Biryani (product)',
      sortOrder: 99,
      scope: CategoryScope.GLOBAL,
      isActive: true,
      deletedAt: null,
    });
    rows.delete([...rows.entries()].find(([, r]) => r.slug === 'biryani' && r.id !== 'product-biryani')?.[0] ?? '');

    const second = await upsertMenuCatalog(prisma, [
      {
        name: 'Food',
        slug: 'menu-food-test',
        sortOrder: 1,
        children: [{ name: 'Biryani', slug: 'biryani', sortOrder: 1 }],
      },
    ]);

    expect(stats.childrenCreated).toBe(1);
    expect(second.childrenSkipped).toBe(1);
    expect(rows.get('product-biryani')?.catalogKind).toBe(CategoryCatalogKind.PRODUCT);
    expect(rows.get('product-biryani')?.name).toBe('Biryani (product)');
  });

  it('only writes MENU catalogKind for created categories', async () => {
    const { prisma, rows } = createMockPrisma();
    await upsertMenuCatalog(prisma, MENU_CATALOG);

    for (const row of rows.values()) {
      expect(row.catalogKind).toBe(CategoryCatalogKind.MENU);
      expect(row.scope).toBe(CategoryScope.GLOBAL);
    }
  });
});
