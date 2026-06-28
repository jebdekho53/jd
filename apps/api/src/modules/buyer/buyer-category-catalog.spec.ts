import {
  fetchStoresForCategory,
  resolveCategoryGrantScope,
} from './buyer-category-catalog';

const GROCERY_ID = 'cat-grocery';
const DAIRY_ID = 'cat-dairy';
const STORE_ID = 'store-1';

function makePrisma(overrides: {
  categoryLookup?: Record<string, { id: string; parentId: string | null } | null>;
  productCounts?: Array<{ storeId: string; productCount: number }>;
} = {}) {
  const {
    categoryLookup = {
      [DAIRY_ID]: { id: DAIRY_ID, parentId: GROCERY_ID },
      [GROCERY_ID]: { id: GROCERY_ID, parentId: null },
    },
    productCounts = [{ storeId: STORE_ID, productCount: 1 }],
  } = overrides;

  return {
    category: {
      findFirst: jest.fn(({ where }: { where: { id: string } }) => {
        const row = categoryLookup[where.id];
        return Promise.resolve(row ?? null);
      }),
      findMany: jest.fn(() => Promise.resolve([])),
    },
    product: {
      groupBy: jest.fn(() =>
        Promise.resolve(
          productCounts.map((c) => ({
            storeId: c.storeId,
            _count: { id: c.productCount },
          })),
        ),
      ),
    },
  } as unknown as import('../../database/prisma.service').PrismaService;
}

describe('buyer-category-catalog', () => {
  describe('resolveCategoryGrantScope', () => {
    it('treats a leaf category id as subcategoryId for grant lookup', async () => {
      const prisma = makePrisma();
      const scope = await resolveCategoryGrantScope(prisma, DAIRY_ID);
      expect(scope).toEqual({
        parentCategoryId: GROCERY_ID,
        subcategoryIds: [DAIRY_ID],
      });
    });

    it('treats a parent category id as parent scope', async () => {
      const prisma = makePrisma();
      const scope = await resolveCategoryGrantScope(prisma, GROCERY_ID);
      expect(scope).toEqual({
        parentCategoryId: GROCERY_ID,
        subcategoryIds: [],
      });
    });
  });

  describe('fetchStoresForCategory', () => {
    it('returns stores when buyer passes a subcategory id (dairy-bakery page)', async () => {
      const prisma = makePrisma();
      const result = await fetchStoresForCategory(prisma, DAIRY_ID);
      expect(result).toEqual([{ storeId: STORE_ID, productCount: 1 }]);
      expect(prisma.product.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['storeId'],
          where: expect.objectContaining({
            categoryId: { in: [DAIRY_ID] },
          }),
        }),
      );
    });

    it('returns empty when no in-stock products in category', async () => {
      const prisma = makePrisma({ productCounts: [] });
      const result = await fetchStoresForCategory(prisma, DAIRY_ID);
      expect(result).toEqual([]);
    });

    it('aggregates product counts per store for parent category scope', async () => {
      const prisma = makePrisma({
        productCounts: [{ storeId: STORE_ID, productCount: 2 }],
      });
      (prisma.category.findMany as jest.Mock).mockResolvedValue([
        { id: DAIRY_ID },
      ]);

      const result = await fetchStoresForCategory(prisma, GROCERY_ID);
      expect(result).toEqual([{ storeId: STORE_ID, productCount: 2 }]);
      expect(prisma.product.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: { in: expect.arrayContaining([DAIRY_ID, GROCERY_ID]) },
          }),
        }),
      );
    });
  });
});
