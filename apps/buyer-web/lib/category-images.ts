import type { CategoryItem } from '@/types/buyer';

type CategoryImageKey =
  | 'fruits'
  | 'vegetables'
  | 'dairy'
  | 'snacks'
  | 'beverages'
  | 'bakery'
  | 'staples'
  | 'household'
  | 'personal-care'
  | 'baby-care'
  | 'pet-care'
  | 'grocery';

const CATEGORY_IMAGE_PATHS: Record<CategoryImageKey, string> = {
  fruits: '/categories/fruits.svg',
  vegetables: '/categories/vegetables.svg',
  dairy: '/categories/dairy.svg',
  snacks: '/categories/snacks.svg',
  beverages: '/categories/beverages.svg',
  bakery: '/categories/bakery.svg',
  staples: '/categories/staples.svg',
  household: '/categories/household.svg',
  'personal-care': '/categories/personal-care.svg',
  'baby-care': '/categories/baby-care.svg',
  'pet-care': '/categories/pet-care.svg',
  grocery: '/categories/grocery.svg',
};

const CATEGORY_MATCHERS: Array<[CategoryImageKey, RegExp]> = [
  ['fruits', /fruit|apple|banana|mango|citrus/i],
  ['vegetables', /vegetable|veg|leafy|green/i],
  ['dairy', /dairy|milk|curd|paneer|cheese|butter/i],
  ['snacks', /snack|namkeen|chips|biscuit|cookie|chocolate/i],
  ['beverages', /beverage|drink|juice|tea|coffee|water|cola/i],
  ['bakery', /bakery|bread|cake|rusk|bun/i],
  ['staples', /staple|atta|rice|dal|pulse|oil|masala|spice|flour/i],
  ['household', /household|clean|detergent|home|kitchen/i],
  ['personal-care', /personal|care|beauty|soap|shampoo|hygiene/i],
  ['baby-care', /baby|kids|diaper/i],
  ['pet-care', /pet|dog|cat/i],
  ['grocery', /grocery|essential|daily/i],
];

export function resolveCategoryImage(category: Pick<CategoryItem, 'name' | 'slug' | 'imageUrl'>): string | null {
  if (category.imageUrl) return category.imageUrl;
  const haystack = `${category.slug} ${category.name}`;
  const match = CATEGORY_MATCHERS.find(([, pattern]) => pattern.test(haystack));
  return match ? CATEGORY_IMAGE_PATHS[match[0]] : null;
}
