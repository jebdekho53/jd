import { Prisma } from '@prisma/client';

/** Shared text search filter for product name, brand, and search index. */
export function buildProductTextSearchWhere(q: string): Prisma.ProductWhereInput {
  const term = q.trim().toLowerCase();
  return {
    OR: [
      { searchIndex: { searchText: { contains: term }, isActive: true } },
      { name: { contains: term, mode: 'insensitive' } },
      { brand: { contains: term, mode: 'insensitive' } },
    ],
  };
}
