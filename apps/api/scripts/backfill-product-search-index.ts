/**
 * Backfill productSearchIndex rows for active products missing an index entry.
 *
 * Usage (from repo root):
 *   pnpm --filter @jebdekho/api exec ts-node scripts/backfill-product-search-index.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function buildSearchText(parts: {
  name: string;
  brand?: string | null;
  description?: string | null;
  categoryName?: string | null;
  tags?: string[];
}): string {
  return [parts.name, parts.brand, parts.description, parts.categoryName, ...(parts.tags ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

async function main() {
  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      searchIndex: null,
    },
    include: {
      category: { select: { name: true } },
    },
    take: 5000,
  });

  if (products.length === 0) {
    console.log('No products missing search index.');
    return;
  }

  let upserted = 0;
  for (const product of products) {
    const searchText = buildSearchText({
      name: product.name,
      brand: product.brand,
      description: product.description,
      categoryName: product.category?.name,
      tags: product.tags,
    });

    await prisma.productSearchIndex.upsert({
      where: { productId: product.id },
      create: {
        productId: product.id,
        storeId: product.storeId,
        name: product.name,
        description: product.description,
        categoryName: product.category?.name ?? null,
        brand: product.brand,
        tags: product.tags,
        searchText,
        isActive: product.isActive,
      },
      update: {
        name: product.name,
        description: product.description,
        categoryName: product.category?.name ?? null,
        brand: product.brand,
        tags: product.tags,
        searchText,
        isActive: product.isActive,
      },
    });
    upserted += 1;
  }

  console.log(`Backfilled ${upserted} product search index row(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
