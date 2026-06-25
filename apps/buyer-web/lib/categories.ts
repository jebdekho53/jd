import type { CategoryItem } from '@/types/buyer';

export function flattenCategories(categories: CategoryItem[]): CategoryItem[] {
  const result: CategoryItem[] = [];
  for (const cat of categories) {
    result.push(cat);
    if (cat.children.length > 0) result.push(...flattenCategories(cat.children));
  }
  return result;
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

/** Fallback categories when API is unavailable */
export const FALLBACK_CATEGORIES: Pick<CategoryItem, 'id' | 'name' | 'slug'>[] = [
  { id: 'fruits', name: 'Fruits', slug: 'fruits' },
  { id: 'vegetables', name: 'Vegetables', slug: 'vegetables' },
  { id: 'dairy', name: 'Dairy', slug: 'dairy' },
  { id: 'snacks', name: 'Snacks', slug: 'snacks' },
  { id: 'beverages', name: 'Beverages', slug: 'beverages' },
  { id: 'bakery', name: 'Bakery', slug: 'bakery' },
  { id: 'grocery', name: 'Grocery', slug: 'grocery' },
  { id: 'household', name: 'Household', slug: 'household' },
];

export function resolveCategorySlug(
  categories: CategoryItem[],
  slug: string,
): { id: string; name: string; slug: string } {
  const found = findCategoryBySlug(categories, slug);
  if (found) return { id: found.id, name: found.name, slug: found.slug };
  const fallback = FALLBACK_CATEGORIES.find((c) => c.slug === slug.toLowerCase());
  if (fallback) return fallback;
  return { id: slug, name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), slug };
}
