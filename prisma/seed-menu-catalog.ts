/**
 * Production-safe MENU catalog seed (catalogKind=MENU only).
 * Idempotent upsert by slug — does not modify PRODUCT catalog categories.
 *
 * Run: pnpm seed:menu-catalog
 */
import { PrismaClient } from '@prisma/client';
import { MENU_CATALOG } from './data/menu-catalog/catalog';
import {
  assertMenuCatalogSlugUniqueness,
  upsertMenuCatalog,
} from './data/menu-catalog/upsert';

const prisma = new PrismaClient();

async function main() {
  assertMenuCatalogSlugUniqueness(MENU_CATALOG);

  console.log('Seeding JebDekho MENU catalog categories…');
  console.log(`  Parents: ${MENU_CATALOG.length}`);
  console.log(
    `  Subcategories: ${MENU_CATALOG.reduce((n, p) => n + (p.children?.length ?? 0), 0)}`,
  );

  const stats = await upsertMenuCatalog(prisma, MENU_CATALOG);

  console.log('MENU catalog seed complete.');
  console.log(
    JSON.stringify(
      {
        parents: {
          created: stats.parentsCreated,
          updated: stats.parentsUpdated,
          skipped: stats.parentsSkipped,
        },
        children: {
          created: stats.childrenCreated,
          updated: stats.childrenUpdated,
          skipped: stats.childrenSkipped,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
