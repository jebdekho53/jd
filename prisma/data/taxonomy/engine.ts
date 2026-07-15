import {
  CategoryCatalogKind,
  CategoryScope,
  PrismaClient,
} from '@prisma/client';

/**
 * Recursive, idempotent global-category taxonomy engine.
 *
 * Extends the 2-level menu-catalog seed to arbitrary depth (L1 → L2 → L3 → L4).
 * A node is matched by (slug, parentId) within GLOBAL scope, so:
 *   - existing categories keep their id (never renamed, never duplicated),
 *   - only genuinely missing nodes are created,
 *   - re-running is a no-op after the first apply.
 *
 * A node whose slug already exists under the same parent but with a DIFFERENT
 * catalogKind is left untouched and reported as a conflict — the taxonomy seed
 * never flips a PRODUCT node to MENU or vice-versa.
 */
export type TaxNode = {
  name: string;
  slug: string;
  children?: TaxNode[];
};

export type TaxRoot = TaxNode & {
  catalogKind: keyof typeof CategoryCatalogKind;
};

export type TaxonomyStats = {
  created: number;
  matched: number;
  conflicts: number;
  /** created count per depth (1 = root). */
  createdByLevel: Record<number, number>;
  /** human-readable list of nodes that would be / were created. */
  plannedCreates: string[];
  conflictDetail: string[];
};

export type TaxonomyPrisma = Pick<PrismaClient, 'category'>;

function emptyStats(): TaxonomyStats {
  return { created: 0, matched: 0, conflicts: 0, createdByLevel: {}, plannedCreates: [], conflictDetail: [] };
}

async function findGlobal(prisma: TaxonomyPrisma, slug: string, parentId: string | null) {
  return prisma.category.findFirst({
    where: { slug, storeId: null, parentId, scope: CategoryScope.GLOBAL, deletedAt: null },
    select: { id: true, name: true, catalogKind: true },
  });
}

async function upsertNode(
  prisma: TaxonomyPrisma,
  node: TaxNode,
  parentId: string | null,
  kind: CategoryCatalogKind,
  sortOrder: number,
  level: number,
  path: string,
  dryRun: boolean,
  stats: TaxonomyStats,
): Promise<string | null> {
  const here = path ? `${path} › ${node.name}` : node.name;
  const existing = await findGlobal(prisma, node.slug, parentId);

  if (existing && existing.catalogKind !== kind) {
    stats.conflicts += 1;
    stats.conflictDetail.push(`${here} [slug ${node.slug}] exists as ${existing.catalogKind}, wanted ${kind} — left as-is`);
    return null; // don't recurse under a conflicting node
  }

  let id: string;
  if (existing) {
    stats.matched += 1;
    id = existing.id;
    if (!dryRun) {
      // Keep sort order / active fresh, but never rename (name may differ only in
      // casing/formatting — we preserve the stored name to honour "do not rename").
      await prisma.category.update({
        where: { id: existing.id },
        data: { sortOrder, isActive: true, deletedAt: null },
      });
    }
  } else {
    stats.created += 1;
    stats.createdByLevel[level] = (stats.createdByLevel[level] ?? 0) + 1;
    stats.plannedCreates.push(`L${level}  ${here}  (${node.slug})`);
    if (dryRun) {
      // Can't get a real id; children under a not-yet-created parent are all new.
      countSubtreeAsNew(node, level + 1, here, kind, stats);
      return null;
    }
    const created = await prisma.category.create({
      data: {
        name: node.name,
        slug: node.slug,
        parentId,
        sortOrder,
        scope: CategoryScope.GLOBAL,
        catalogKind: kind,
        isActive: true,
      },
      select: { id: true },
    });
    id = created.id;
  }

  const children = node.children ?? [];
  for (let i = 0; i < children.length; i++) {
    await upsertNode(prisma, children[i], id, kind, i + 1, level + 1, here, dryRun, stats);
  }
  return id;
}

/** Dry-run helper: everything under a parent that would be created is also new. */
function countSubtreeAsNew(node: TaxNode, level: number, path: string, kind: CategoryCatalogKind, stats: TaxonomyStats): void {
  for (let i = 0; i < (node.children ?? []).length; i++) {
    const child = node.children![i];
    const here = `${path} › ${child.name}`;
    stats.created += 1;
    stats.createdByLevel[level] = (stats.createdByLevel[level] ?? 0) + 1;
    stats.plannedCreates.push(`L${level}  ${here}  (${child.slug})`);
    countSubtreeAsNew(child, level + 1, here, kind, stats);
  }
}

export async function upsertTaxonomy(
  prisma: TaxonomyPrisma,
  roots: TaxRoot[],
  opts: { dryRun?: boolean } = {},
): Promise<TaxonomyStats> {
  const dryRun = opts.dryRun ?? false;
  const stats = emptyStats();
  for (let i = 0; i < roots.length; i++) {
    const root = roots[i];
    const kind = CategoryCatalogKind[root.catalogKind];
    await upsertNode(prisma, root, null, kind, i + 1, 1, '', dryRun, stats);
  }
  return stats;
}

/** Depth-first slug list for uniqueness assertions in tests. */
export function collectSlugs(roots: TaxNode[]): string[] {
  const out: string[] = [];
  const walk = (n: TaxNode) => {
    out.push(n.slug);
    for (const c of n.children ?? []) walk(c);
  };
  roots.forEach(walk);
  return out;
}

export function assertUniqueSlugs(roots: TaxNode[]): void {
  const seen = new Map<string, string>();
  const walk = (n: TaxNode, path: string) => {
    const here = path ? `${path} › ${n.name}` : n.name;
    if (seen.has(n.slug)) {
      throw new Error(`Duplicate taxonomy slug "${n.slug}" at "${here}" (also at "${seen.get(n.slug)}")`);
    }
    seen.set(n.slug, here);
    for (const c of n.children ?? []) walk(c, here);
  };
  roots.forEach((r) => walk(r, ''));
}
