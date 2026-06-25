/** Maps lifestyle collection slugs to search behaviour */
export const SEARCH_COLLECTIONS: Record<
  string,
  { title: string; q?: string; dealsOnly?: boolean }
> = {
  'healthy-living': { title: 'Healthy Living', q: 'organic' },
  'budget-shopping': { title: 'Budget Shopping', dealsOnly: true },
  'family-essentials': { title: 'Family Essentials', q: 'essentials' },
  'student-essentials': { title: 'Student Essentials', q: 'snacks' },
  'quick-meals': { title: 'Quick Meals', q: 'ready' },
};

export function resolveCollection(slug: string | null) {
  if (!slug) return null;
  return SEARCH_COLLECTIONS[slug.toLowerCase()] ?? null;
}
