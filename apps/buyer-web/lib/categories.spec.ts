import type { CategoryItem } from '@/types/buyer';
import { flattenCategories, findCategoryBySlug, getCategoryAncestors } from './categories';

function cat(partial: Partial<CategoryItem> & { id: string; slug: string; name: string }): CategoryItem {
  return {
    imageUrl: null,
    parentId: null,
    sortOrder: 0,
    children: [],
    ...partial,
  };
}

// Root → Sub → Leaf tree mirroring the live 3-level taxonomy shape.
const tree: CategoryItem[] = [
  cat({
    id: 'health',
    slug: 'health-nutrition',
    name: 'Health & Nutrition',
    children: [
      cat({
        id: 'protein',
        slug: 'protein-gym-supplements',
        name: 'Protein & Gym Supplements',
        parentId: 'health',
        children: [
          cat({ id: 'whey', slug: 'whey-protein', name: 'Whey Protein', parentId: 'protein' }),
          cat({ id: 'mass', slug: 'mass-gainer', name: 'Mass Gainer', parentId: 'protein' }),
        ],
      }),
    ],
  }),
];

describe('categories lib', () => {
  it('flattens every level of the tree (root, sub and leaf are all reachable)', () => {
    const slugs = flattenCategories(tree).map((c) => c.slug);
    expect(slugs).toEqual(['health-nutrition', 'protein-gym-supplements', 'whey-protein', 'mass-gainer']);
  });

  it('finds a deep leaf category by slug', () => {
    expect(findCategoryBySlug(tree, 'whey-protein')?.name).toBe('Whey Protein');
  });

  it('builds a full root→…→current breadcrumb chain for a leaf', () => {
    const chain = getCategoryAncestors(tree, 'whey-protein').map((c) => c.slug);
    expect(chain).toEqual(['health-nutrition', 'protein-gym-supplements', 'whey-protein']);
  });

  it('returns just the root for a root slug', () => {
    expect(getCategoryAncestors(tree, 'health-nutrition').map((c) => c.slug)).toEqual(['health-nutrition']);
  });

  it('returns empty for an unknown slug', () => {
    expect(getCategoryAncestors(tree, 'does-not-exist')).toEqual([]);
  });
});
