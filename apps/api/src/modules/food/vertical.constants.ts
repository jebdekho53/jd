import { VerticalBusinessType } from '@prisma/client';

/** Food verticals that use restaurant menu + food cart. */
export const FOOD_VERTICALS: ReadonlySet<VerticalBusinessType> = new Set([
  VerticalBusinessType.RESTAURANT,
  VerticalBusinessType.CLOUD_KITCHEN,
  VerticalBusinessType.CAFE,
]);

/** Verticals shown on buyer home top navigation. */
export const BUYER_HOME_VERTICALS: {
  label: string;
  slug: string;
  businessType: VerticalBusinessType;
  href: string;
}[] = [
  { label: 'Grocery', slug: 'grocery', businessType: VerticalBusinessType.GROCERY, href: '/?vertical=grocery' },
  { label: 'Food', slug: 'food', businessType: VerticalBusinessType.RESTAURANT, href: '/food' },
  { label: 'Bakery', slug: 'bakery', businessType: VerticalBusinessType.BAKERY, href: '/?vertical=bakery' },
  { label: 'Cafe', slug: 'cafe', businessType: VerticalBusinessType.CAFE, href: '/?vertical=cafe' },
  { label: 'Fresh', slug: 'fresh', businessType: VerticalBusinessType.FRUITS_VEGETABLES, href: '/?vertical=fresh' },
  { label: 'Beauty', slug: 'beauty', businessType: VerticalBusinessType.BEAUTY, href: '/?vertical=beauty' },
  { label: 'Pet', slug: 'pet', businessType: VerticalBusinessType.PET_STORE, href: '/?vertical=pet' },
  { label: 'Electronics', slug: 'electronics', businessType: VerticalBusinessType.ELECTRONICS, href: '/?vertical=electronics' },
  { label: 'Flowers', slug: 'flowers', businessType: VerticalBusinessType.FLOWERS, href: '/?vertical=flowers' },
  { label: 'Baby', slug: 'baby', businessType: VerticalBusinessType.BABY_STORE, href: '/?vertical=baby' },
  { label: 'Supplements', slug: 'supplements', businessType: VerticalBusinessType.SUPPLEMENTS, href: '/?vertical=supplements' },
];

export const MENU_CATEGORY_PRESETS = [
  'PIZZA', 'BURGER', 'ROLLS', 'CHINESE', 'BIRYANI', 'SOUTH_INDIAN', 'NORTH_INDIAN',
  'DESSERTS', 'BEVERAGES', 'COFFEE', 'FAST_FOOD', 'HEALTHY', 'STREET_FOOD',
] as const;

export function isFoodVertical(type: VerticalBusinessType): boolean {
  return FOOD_VERTICALS.has(type);
}

export function slugifyMenu(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}
