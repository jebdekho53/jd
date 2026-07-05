import type { CategoryItem } from '@/types/buyer';

const CATEGORY_IMAGE_PATHS = {
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
} as const;

type CategoryImageKey = keyof typeof CATEGORY_IMAGE_PATHS;

const STATIC_CATEGORY_IMAGES: Record<string, string> = {
  bakery: '/categories/bakery.png',
  beverages: '/categories/beverages.png',
  biryani: '/categories/biryani.png',
  bread: '/categories/bread.png',
  breakfast: '/categories/breakfast.png',
  brownie: '/categories/brownies.png',
  brownies: '/categories/brownies.png',
  burger: '/categories/burger.png',
  cafe: '/categories/cafe.png',
  cakes: '/categories/cakes.png',
  cake: '/categories/cakes.png',
  chicken: '/categories/chicken.png',
  chinese: '/categories/chinese.png',
  coffee: '/categories/cofee.png',
  cofee: '/categories/cofee.png',
  'cold-coffee': '/categories/coldcofee.png',
  coldcofee: '/categories/coldcofee.png',
  cookies: '/categories/cookies.png',
  cookie: '/categories/cookies.png',
  'dairy-bakery': '/categories/diary%26bakery.png',
  'dairy-and-bakery': '/categories/diary%26bakery.png',
  'diary-bakery': '/categories/diary%26bakery.png',
  'diary-and-bakery': '/categories/diary%26bakery.png',
  'fruits-vegetables': '/categories/fruits%26vegetables.png',
  'fruit-vegetables': '/categories/fruits%26vegetables.png',
  'fruits-and-vegetables': '/categories/fruits%26vegetables.png',
  groceries: '/categories/groceriees.png',
  groceriees: '/categories/groceriees.png',
  grocery: '/categories/groceriees.png',
  'health-nutrition': '/categories/health%20supplements.png',
  'health-and-nutrition': '/categories/health%20supplements.png',
  'health-supplements': '/categories/health%20supplements.png',
  supplements: '/categories/health%20supplements.png',
  'healthy-food': '/categories/healthy%20food.png',
  'fresh-food': '/categories/healthy%20food.png',
  'home-appliances': '/categories/homeelectronics.png',
  'home-electronics': '/categories/homeelectronics.png',
  electronics: '/categories/homeelectronics.png',
  'mobile-accessories': '/categories/mobileaccesories.png',
  mobileaccesories: '/categories/mobileaccesories.png',
  ladoo: '/categories/ladoo.png',
  laddu: '/categories/ladoo.png',
  mithai: '/categories/mithai.png',
  'indian-sweets': '/categories/mithai.png',
  sweets: '/categories/sweets.png',
  desserts: '/categories/sweets.png',
  'gulab-jamun': '/categories/gulabjamun.png',
  gulabjamun: '/categories/gulabjamun.png',
  momos: '/categories/momos.png',
  momo: '/categories/momos.png',
  'north-indian': '/categories/north%20indian.png',
  pasta: '/categories/pasta.png',
  pastry: '/categories/pastry.png',
  'personal-care': '/categories/personalcare.png',
  personalcare: '/categories/personalcare.png',
  pizza: '/categories/pizza.png',
  rasgulla: '/categories/rasgulla.png',
  rolls: '/categories/roll.png',
  roll: '/categories/roll.png',
  sandwich: '/categories/sandwich.png',
  shakes: '/categories/shakes.png',
  shake: '/categories/shakes.png',
  'cafe-snacks': '/categories/snacks.png',
  snacks: '/categories/snacks.png',
  'fast-food': '/categories/burger.png',
  'street-food': '/categories/roll.png',
  'south-indian': '/categories/south%20indian.png',
  tea: '/categories/tea.png',
  thali: '/categories/thali.png',
  'meat-fish': '/categories/meat%26fish.png',
  'meat-and-fish': '/categories/meat%26fish.png',
  meat: '/categories/meat%26fish.png',
  mutton: '/categories/meat%26fish.png',
  fish: '/categories/fish.png',
  eggs: '/categories/eggs.png',
  food: '/categories/healthy%20food.png',
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

function normalizeCategoryKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function resolveCategoryImage(category: Pick<CategoryItem, 'name' | 'slug' | 'imageUrl'>): string | null {
  const normalizedSlug = normalizeCategoryKey(category.slug);
  const normalizedName = normalizeCategoryKey(category.name);
  const staticImage =
    STATIC_CATEGORY_IMAGES[normalizedSlug] ??
    STATIC_CATEGORY_IMAGES[normalizedSlug.replace(/^menu-/, '')] ??
    STATIC_CATEGORY_IMAGES[normalizedName];
  if (staticImage) return staticImage;
  if (category.imageUrl) return category.imageUrl;
  const haystack = `${category.slug} ${category.name}`;
  const match = CATEGORY_MATCHERS.find(([, pattern]) => pattern.test(haystack));
  return match ? CATEGORY_IMAGE_PATHS[match[0]] : null;
}
