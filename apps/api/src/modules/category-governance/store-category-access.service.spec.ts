import { ForbiddenException } from '@nestjs/common';
import { StoreCategoryAccessService } from './store-category-access.service';
import type { PrismaService } from '../../database/prisma.service';

/**
 * Regression cover for by-branch menu approval: a store approved for the root
 * "Bakery" MENU category must be able to create menu categories for its children
 * (Cakes, Pastry, …). The earlier exact parent+child pair lookup rejected them,
 * which left approved bakeries with a menu builder they could not write to.
 */
const BAKERY = 'cat-bakery';
const CAKES = 'cat-cakes';

function buildPrisma(overrides: Record<string, unknown> = {}) {
  return {
    category: {
      findFirst: jest.fn().mockResolvedValue({
        id: CAKES,
        parentId: BAKERY,
        slug: 'cakes',
        name: 'Cakes',
      }),
      findUnique: jest.fn().mockImplementation(({ where }: { where: { id: string } }) =>
        Promise.resolve(where.id === CAKES ? { parentId: BAKERY } : { parentId: null }),
      ),
    },
    storeCategory: { findFirst: jest.fn().mockResolvedValue(null) },
    storeCategoryRequest: { findFirst: jest.fn().mockResolvedValue(null) },
    merchantCategory: { findFirst: jest.fn().mockResolvedValue(null) },
    ...overrides,
  } as unknown as PrismaService;
}

describe('StoreCategoryAccessService.assertMenuSubcategoryApproved', () => {
  it('allows a child when the store is approved for the parent branch', async () => {
    const prisma = buildPrisma({
      // Approval row granted on the root: (categoryId, subcategoryId) = (Bakery, Bakery)
      storeCategory: { findFirst: jest.fn().mockResolvedValue({ id: 'sc-1' }) },
    });
    const service = new StoreCategoryAccessService(prisma);

    await expect(
      service.assertMenuSubcategoryApproved('store-1', 'profile-1', CAKES),
    ).resolves.toEqual({ parentId: BAKERY, subcategoryId: CAKES, slug: 'cakes', name: 'Cakes' });
  });

  it('allows a child when an approved category request covers the parent branch', async () => {
    const prisma = buildPrisma({
      storeCategoryRequest: { findFirst: jest.fn().mockResolvedValue({ id: 'req-1' }) },
    });
    const service = new StoreCategoryAccessService(prisma);

    await expect(
      service.assertMenuSubcategoryApproved('store-1', 'profile-1', CAKES),
    ).resolves.toMatchObject({ subcategoryId: CAKES });
  });

  it('rejects when the store has no approval anywhere on the branch', async () => {
    const service = new StoreCategoryAccessService(buildPrisma());

    await expect(
      service.assertMenuSubcategoryApproved('store-1', 'profile-1', CAKES),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a category that is not in the MENU catalog', async () => {
    const prisma = buildPrisma({
      category: { findFirst: jest.fn().mockResolvedValue(null), findUnique: jest.fn() },
    });
    const service = new StoreCategoryAccessService(prisma);

    await expect(
      service.assertMenuSubcategoryApproved('store-1', 'profile-1', 'cat-soap'),
    ).rejects.toThrow('Menu subcategory not found or is not a MENU catalog category');
  });
});
