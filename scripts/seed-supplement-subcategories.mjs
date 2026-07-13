/**
 * Seeds the Health & Supplements subcategory tree under the existing
 * global "Supplements" category (Health & Nutrition → Supplements → groups → leaves).
 *
 * Idempotent: safe to re-run. Matches by (slug, parentId, storeId=null).
 * Run:  node --env-file=.env scripts/seed-supplement-subcategories.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TREE = [
  {
    name: 'Protein & Gym Supplements',
    slug: 'protein-gym-supplements',
    children: [
      ['Whey Protein', 'whey-protein'],
      ['Whey Isolate', 'whey-isolate'],
      ['Mass Gainer', 'mass-gainer'],
      ['Weight Gainer', 'weight-gainer'],
      ['Protein Bars', 'protein-bars'],
      ['Protein Cookies', 'protein-cookies'],
      ['Plant Protein', 'plant-protein'],
      ['Soy Protein', 'soy-protein'],
    ],
  },
  {
    name: 'Workout Performance',
    slug: 'workout-performance',
    children: [
      ['Creatine', 'creatine'],
      ['BCAA', 'bcaa'],
      ['EAA', 'eaa'],
      ['Pre-Workout', 'pre-workout'],
      ['Post-Workout', 'post-workout'],
      ['Glutamine', 'glutamine'],
      ['L-Carnitine', 'l-carnitine'],
      ['Electrolytes', 'electrolytes'],
    ],
  },
  {
    name: 'Vitamins & Daily Health',
    slug: 'vitamins-daily-health',
    children: [
      ['Multivitamins', 'multivitamins'],
      ['Vitamin C', 'vitamin-c'],
      ['Vitamin D', 'vitamin-d'],
      ['Calcium', 'calcium'],
      ['Zinc', 'zinc'],
      ['Iron', 'iron'],
      ['Magnesium', 'magnesium'],
      ['Omega-3 / Fish Oil', 'omega-3-fish-oil'],
    ],
  },
  {
    name: 'Wellness / Lifestyle',
    slug: 'wellness-lifestyle',
    children: [
      ['Immunity Boosters', 'immunity-boosters'],
      ['Energy Drinks', 'energy-drinks'],
      ['ORS / Hydration', 'ors-hydration'],
      ['Digestive Health', 'digestive-health'],
      ['Probiotics', 'probiotics'],
      ['Herbal Supplements', 'herbal-supplements'],
      ['Ayurveda Wellness', 'ayurveda-wellness'],
      ['Weight Management', 'weight-management'],
    ],
  },
];

async function upsertCategory(name, slug, parentId, sortOrder) {
  const existing = await prisma.category.findFirst({
    where: { slug, parentId, storeId: null },
  });
  if (existing) {
    return prisma.category.update({
      where: { id: existing.id },
      data: { name, sortOrder, isActive: true, deletedAt: null },
    });
  }
  return prisma.category.create({
    data: { name, slug, parentId, sortOrder, scope: 'GLOBAL', catalogKind: 'PRODUCT', isActive: true },
  });
}

async function main() {
  // Anchor: the existing global "Supplements" category.
  const supplements = await prisma.category.findFirst({
    where: { slug: 'supplements', storeId: null },
  });
  if (!supplements) {
    throw new Error('Global "Supplements" category not found — cannot attach subcategories.');
  }

  let groups = 0;
  let leaves = 0;
  for (let g = 0; g < TREE.length; g++) {
    const group = TREE[g];
    const groupCat = await upsertCategory(group.name, group.slug, supplements.id, g + 1);
    groups++;
    for (let i = 0; i < group.children.length; i++) {
      const [leafName, leafSlug] = group.children[i];
      await upsertCategory(leafName, leafSlug, groupCat.id, i + 1);
      leaves++;
    }
  }

  console.log(`✓ Seeded under "Supplements": ${groups} groups, ${leaves} leaf subcategories.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
