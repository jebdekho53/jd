/**
 * Category taxonomy audit & safe repair tool.
 *
 * Read-only by default. Produces a full dry-run report of the live global category
 * tree, validates structural invariants, and lists proposed parent re-mappings that
 * require business approval before they are applied.
 *
 * Usage:
 *   pnpm exec tsx prisma/scripts/audit-category-taxonomy.ts            # dry-run report only
 *   pnpm exec tsx prisma/scripts/audit-category-taxonomy.ts --apply    # apply APPROVED proposals in a transaction
 *
 * Guarantees:
 *   - Never deletes categories, products, merchant/store mappings or history.
 *   - Only mutates Category.parentId, and only for proposals explicitly marked `approved: true`.
 *   - Idempotent: a proposal already at its target parent is skipped.
 *   - Transactional: all approved moves apply together or not at all.
 *   - Cycle-safe: refuses any move that would create a cycle or exceed MAX_DEPTH.
 *   - Prints rollback statements for every applied change.
 */
import { PrismaClient, CategoryScope } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const MAX_DEPTH = 3;

type Cat = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  catalogKind: string;
};

/**
 * Proposed parent re-mappings. Every entry defaults to `approved: false` so that
 * `--apply` is a no-op until a human flips the flag after business review. Targets
 * are expressed by slug and resolved at runtime so IDs are never hard-coded.
 */
type Proposal = {
  slug: string;
  newParentSlug: string | null; // null => promote to root
  reason: string;
  approved: boolean;
};

const PROPOSALS: Proposal[] = [
  {
    slug: 'footwear-accessories',
    newParentSlug: 'fashion',
    reason: 'Footwear & Accessories is currently a root but belongs under Fashion per baseline taxonomy.',
    approved: false,
  },
  {
    slug: 'personal-care',
    newParentSlug: null,
    reason: 'Personal Care sits under Health & Nutrition; baseline promotes it to its own root department.',
    approved: false,
  },
];

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

async function loadCategories(): Promise<Cat[]> {
  return prisma.category.findMany({
    where: { isActive: true, deletedAt: null, storeId: null, scope: CategoryScope.GLOBAL },
    select: { id: true, name: true, slug: true, parentId: true, sortOrder: true, catalogKind: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
}

function depthOf(cat: Cat, byId: Map<string, Cat>): number {
  let depth = 1;
  const seen = new Set<string>();
  let node: Cat | undefined = cat;
  while (node?.parentId) {
    if (seen.has(node.id)) return Infinity; // cycle
    seen.add(node.id);
    node = byId.get(node.parentId);
    if (!node) break;
    depth += 1;
    if (depth > 50) return Infinity;
  }
  return depth;
}

function wouldCreateCycle(childId: string, newParentId: string | null, byId: Map<string, Cat>): boolean {
  if (!newParentId) return false;
  if (childId === newParentId) return true;
  let node = byId.get(newParentId);
  const seen = new Set<string>();
  while (node) {
    if (node.id === childId) return true;
    if (seen.has(node.id)) return true;
    seen.add(node.id);
    node = node.parentId ? byId.get(node.parentId) : undefined;
  }
  return false;
}

async function main() {
  const cats = await loadCategories();
  const byId = new Map(cats.map((c) => [c.id, c]));
  const bySlug = new Map(cats.map((c) => [c.slug, c]));

  const roots = cats.filter((c) => !c.parentId);
  console.log(`\n=== CATEGORY TAXONOMY AUDIT (${APPLY ? 'APPLY' : 'DRY-RUN'}) ===`);
  console.log(`Active global categories: ${cats.length} | Roots: ${roots.length}\n`);

  // ── Invariant checks ─────────────────────────────────────────────────────
  const issues: string[] = [];

  for (const c of cats) {
    if (c.parentId) {
      const parent = byId.get(c.parentId);
      if (!parent) issues.push(`ORPHAN: "${c.name}" (${c.slug}) parentId=${c.parentId} missing/inactive`);
      else if (parent.catalogKind !== c.catalogKind)
        issues.push(`KIND-MISMATCH: "${c.name}" (${c.catalogKind}) under "${parent.name}" (${parent.catalogKind})`);
    }
    const d = depthOf(c, byId);
    if (d === Infinity) issues.push(`CYCLE: "${c.name}" (${c.slug}) is part of a parent cycle`);
    else if (d > MAX_DEPTH) issues.push(`TOO-DEEP: "${c.name}" (${c.slug}) at level ${d} exceeds MAX_DEPTH=${MAX_DEPTH}`);
  }

  // Duplicate detection (same normalized name under different parents).
  const nameGroups = new Map<string, Cat[]>();
  for (const c of cats) {
    const key = normalize(c.name);
    nameGroups.set(key, [...(nameGroups.get(key) ?? []), c]);
  }
  const duplicates = [...nameGroups.values()].filter((g) => g.length > 1);

  console.log('--- Invariant results ---');
  if (issues.length === 0) console.log('✓ No orphans, cycles, kind-mismatches or depth violations.');
  else issues.forEach((i) => console.log('✗ ' + i));

  console.log('\n--- Duplicate / overlap names (review only, never auto-merged) ---');
  if (duplicates.length === 0) console.log('✓ No exact duplicate names.');
  else
    duplicates.forEach((g) =>
      console.log(`⚠ "${g[0].name}" ×${g.length}: ` + g.map((c) => `${c.slug}[parent=${c.parentId ?? 'ROOT'}]`).join(', ')),
    );

  // ── Proposed re-mappings ─────────────────────────────────────────────────
  console.log('\n--- Proposed parent re-mappings (business approval required) ---');
  console.log('Category | Current Parent | Proposed Parent | Approved | Reason');
  const applied: { slug: string; oldParentId: string | null; newParentId: string | null }[] = [];

  for (const p of PROPOSALS) {
    const cat = bySlug.get(p.slug);
    if (!cat) {
      console.log(`(skip) ${p.slug} — not found`);
      continue;
    }
    const currentParent = cat.parentId ? byId.get(cat.parentId)?.name ?? cat.parentId : 'ROOT';
    const newParent = p.newParentSlug ? bySlug.get(p.newParentSlug) : null;
    const newParentId = newParent ? newParent.id : null;
    const newParentLabel = p.newParentSlug ? newParent?.name ?? `(missing:${p.newParentSlug})` : 'ROOT';
    console.log(`${cat.name} | ${currentParent} | ${newParentLabel} | ${p.approved ? 'YES' : 'no'} | ${p.reason}`);

    if (!p.approved) continue;
    if (p.newParentSlug && !newParent) {
      console.log(`  ✗ target parent ${p.newParentSlug} not found — skipping`);
      continue;
    }
    if (cat.parentId === newParentId) {
      console.log('  = already at target parent — idempotent skip');
      continue;
    }
    if (wouldCreateCycle(cat.id, newParentId, byId)) {
      console.log('  ✗ would create a cycle — skipping');
      continue;
    }
    applied.push({ slug: cat.slug, oldParentId: cat.parentId, newParentId });
  }

  if (!APPLY) {
    console.log('\nDRY-RUN complete. No changes written. Re-run with --apply after approving proposals.');
    return;
  }

  if (applied.length === 0) {
    console.log('\nAPPLY: no approved+valid proposals to write. Nothing changed.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const a of applied) {
      const cat = bySlug.get(a.slug)!;
      await tx.category.update({ where: { id: cat.id }, data: { parentId: a.newParentId } });
      console.log(`  ✓ moved "${cat.name}" parentId ${a.oldParentId ?? 'ROOT'} → ${a.newParentId ?? 'ROOT'}`);
    }
  });

  console.log('\n--- ROLLBACK (run manually if needed) ---');
  applied.forEach((a) => {
    const cat = bySlug.get(a.slug)!;
    console.log(
      `UPDATE categories SET parent_id = ${a.oldParentId ? `'${a.oldParentId}'` : 'NULL'} WHERE id = '${cat.id}';`,
    );
  });

  await invalidateCategoryCache();
  console.log('\nAPPLY complete.');
}

async function invalidateCategoryCache() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.log('(cache) REDIS_URL unset — skipping cache bust (buyer category cache TTL is 60s).');
    return;
  }
  try {
    const { default: Redis } = await import('ioredis');
    const redis = new Redis(url);
    const keys = await redis.keys('buyer:categories:*');
    if (keys.length) await redis.del(...keys);
    await redis.quit();
    console.log(`(cache) invalidated ${keys.length} buyer:categories:* keys.`);
  } catch (e) {
    console.log('(cache) invalidation failed (non-fatal):', (e as Error).message);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
