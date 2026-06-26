import { MerchantCategoryStatus } from '@prisma/client';
import {
  fetchStoresForCategory,
  resolveCategoryGrantScope,
} from './buyer-category-catalog';

const GROCERY_ID = 'cat-grocery';
const DAIRY_ID = 'cat-dairy';
const STORE_ID = 'store-1';

function makePrisma(overrides: {
  categoryLookup?: Record<string, { id: string; parentId: string | null } | null>;
  storeCategoryGrants?: Array<{ storeId: string; subcategoryId: string }>;
  legacyGrants?: Array<{ merchantProfileId: string; categoryId: string }>;
  productCounts?: Array<{ storeId: string; productCount: number }>;
} = {}) {
  const {
    categoryLookup = {
      [DAIRY_ID]: { id: DAIRY_ID, parentId: GROCERY_ID },
      [GROCERY_ID]: { id: GROCERY_ID, parentId: null },
    },
    storeCategoryGrants = [{ storeId: STORE_ID, subcategoryId: DAIRY_ID }],
    legacyGrants = [],
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
    storeCategory: {
      findMany: jest.fn(({ where }: { where: { subcategoryId?: { in: string[] }; categoryId?: string } }) => {
        if (where.subcategoryId?.in) {
          return Promise.resolve(
            storeCategoryGrants.filter((g) => where.subcategoryId!.in.includes(g.subcategoryId)),
          );
        }
        if (where.categoryId) {
          return Promise.resolve(storeCategoryGrants);
        }
        return Promise.resolve([]);
      }),
    },
    merchantCategory: {
      findMany: jest.fn(() => Promise.resolve(legacyGrants)),
    },
    store: {
      findMany: jest.fn(() =>
        Promise.resolve(
          legacyGrants.length
            ? [{ id: STORE_ID, merchantProfileId: 'mp-1' }]
            : [],
        ),
      ),
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
      expect(prisma.storeCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { subcategoryId: { in: [DAIRY_ID] } },
        }),
      );
    });

    it('returns empty when no grants and no legacy approvals', async () => {
      const prisma = makePrisma({ storeCategoryGrants: [], productCounts: [] });
      const result = await fetchStoresForCategory(prisma, DAIRY_ID);
      expect(result).toEqual([]);
    });

    it('falls back to legacy merchant category grants', async () => {
      const prisma = makePrisma({
        storeCategoryGrants: [],
        legacyGrants: [
          { merchantProfileId: 'mp-1', categoryId: DAIRY_ID },
        ],
        productCounts: [{ storeId: STORE_ID, productCount: 2 }],
      });

      (prisma.category.findMany as jest.Mock).mockResolvedValue([
        { id: DAIRY_ID, parentId: GROCERY_ID },
      ]);

      const result = await fetchStoresForCategory(prisma, DAIRY_ID);
      expect(result).toEqual([{ storeId: STORE_ID, productCount: 2 }]);
      expect(prisma.merchantCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: MerchantCategoryStatus.APPROVED,
          }),
        }),
      );
    });
  });
});
