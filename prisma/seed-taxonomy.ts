/**
 * Enterprise GLOBAL category taxonomy seed — idempotent, recursive (L1→L4).
 *
 *   Dry-run (default, no writes):  pnpm exec tsx prisma/seed-taxonomy.ts
 *   Apply:                         pnpm exec tsx prisma/seed-taxonomy.ts --apply
 *
 * Matches existing categories by (slug, parentId) in GLOBAL scope, so it never
 * duplicates or renames the 96 existing nodes — it only fills in missing depth.
 * Safe to run repeatedly.
 */
import { PrismaClient } from '@prisma/client';
import { PRODUCT_TAXONOMY } from './data/taxonomy/product-taxonomy';
import { EXTRA_TAXONOMY } from './data/taxonomy/taxonomy-extra';
import { MENU_TAXONOMY } from './data/taxonomy/menu-taxonomy';
import { assertUniqueSlugs, upsertTaxonomy, type TaxRoot } from './data/taxonomy/engine';

const prisma = new PrismaClient();
const ALL: TaxRoot[] = [...PRODUCT_TAXONOMY, ...EXTRA_TAXONOMY, ...MENU_TAXONOMY];

async function main() {
  const apply = process.argv.includes('--apply');
  const verbose = process.argv.includes('--verbose');

  assertUniqueSlugs(ALL); // fails fast on any duplicate slug in the definition

  console.log(`JebDekho taxonomy seed — mode: ${apply ? 'APPLY (writing)' : 'DRY-RUN (no writes)'}`);
  console.log(`Roots: ${ALL.length} (PRODUCT ${PRODUCT_TAXONOMY.length + EXTRA_TAXONOMY.length}, MENU ${MENU_TAXONOMY.length})`);

  const stats = await upsertTaxonomy(prisma, ALL, { dryRun: !apply });

  console.log('\n──────── result ────────');
  console.log(`Matched (already present): ${stats.matched}`);
  console.log(`${apply ? 'Created' : 'Would create'}:            ${stats.created}`);
  console.log(`By level: ${JSON.stringify(stats.createdByLevel)}`);
  console.log(`Conflicts (left as-is):    ${stats.conflicts}`);

  if (stats.conflictDetail.length) {
    console.log('\nConflicts:');
    stats.conflictDetail.forEach((c) => console.log('  ! ' + c));
  }
  if (verbose || !apply) {
    console.log(`\n${apply ? 'Created' : 'Would create'} nodes (${stats.created}):`);
    stats.plannedCreates.forEach((p) => console.log('  + ' + p));
  }
  console.log('\nDone.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
