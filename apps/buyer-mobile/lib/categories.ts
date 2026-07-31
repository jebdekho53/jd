import type { CategoryItem } from '@/types/buyer';

/** Mirrors buyer-web's lib/categories.ts so the category tree behaves
 *  identically on both clients — same API, same tree-walking logic. */

export function flattenCategories(categories: CategoryItem[]): CategoryItem[] {
  const result: CategoryItem[] = [];
  for (const cat of categories) {
    result.push(cat);
    if (cat.children.length > 0) result.push(...flattenCategories(cat.children));
  }
  return result;
}

/**
 * Ancestor chain for a category slug, ordered root → … → current (inclusive).
 * Derived purely from parentId links in the tree; cycle-safe.
 */
export function getCategoryAncestors(categories: CategoryItem[], slug: string): CategoryItem[] {
  const flat = flattenCategories(categories);
  const byId = new Map(flat.map((c) => [c.id, c]));
  const start = flat.find((c) => c.slug === slug);
  if (!start) return [];
  const chain: CategoryItem[] = [];
  const seen = new Set<string>();
  let node: CategoryItem | undefined = start;
  while (node && !seen.has(node.id)) {
    seen.add(node.id);
    chain.unshift(node);
    node = node.parentId ? byId.get(node.parentId) : undefined;
  }
  return chain;
}

export function findCategoryBySlug(categories: CategoryItem[], slug: string): CategoryItem | undefined {
  const normalized = slug.toLowerCase();
  const flat = flattenCategories(categories);
  return (
    flat.find((c) => c.slug.toLowerCase() === normalized) ??
    flat.find((c) => c.slug.toLowerCase().includes(normalized)) ??
    flat.find((c) => c.name.toLowerCase().replace(/\s+/g, '-') === normalized)
  );
}
