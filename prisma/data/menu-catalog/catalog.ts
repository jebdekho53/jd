export type MenuCatalogNode = {
  name: string;
  slug: string;
  sortOrder: number;
  children?: MenuCatalogNode[];
};

/** JebDekho production MENU catalog — global parents + subcategories (catalogKind=MENU). */
export const MENU_CATALOG: MenuCatalogNode[] = [
  {
    name: 'Food',
    slug: 'menu-food',
    sortOrder: 1,
    children: [
      { name: 'Biryani', slug: 'biryani', sortOrder: 1 },
      { name: 'North Indian', slug: 'north-indian', sortOrder: 2 },
      { name: 'South Indian', slug: 'south-indian', sortOrder: 3 },
      { name: 'Chinese', slug: 'chinese', sortOrder: 4 },
      { name: 'Pizza', slug: 'pizza', sortOrder: 5 },
      { name: 'Burger', slug: 'burger', sortOrder: 6 },
      { name: 'Rolls', slug: 'rolls', sortOrder: 7 },
      { name: 'Momos', slug: 'momos', sortOrder: 8 },
      { name: 'Sandwich', slug: 'sandwich', sortOrder: 9 },
      { name: 'Fast Food', slug: 'fast-food', sortOrder: 10 },
      { name: 'Street Food', slug: 'street-food', sortOrder: 11 },
      { name: 'Desserts', slug: 'desserts', sortOrder: 12 },
      { name: 'Beverages', slug: 'beverages', sortOrder: 13 },
      { name: 'Healthy Food', slug: 'healthy-food', sortOrder: 14 },
      { name: 'Breakfast', slug: 'breakfast', sortOrder: 15 },
      { name: 'Thali', slug: 'thali', sortOrder: 16 },
    ],
  },
  {
    name: 'Cafe',
    slug: 'menu-cafe',
    sortOrder: 2,
    children: [
      { name: 'Coffee', slug: 'coffee', sortOrder: 1 },
      { name: 'Tea', slug: 'tea', sortOrder: 2 },
      { name: 'Cold Coffee', slug: 'cold-coffee', sortOrder: 3 },
      { name: 'Shakes', slug: 'shakes', sortOrder: 4 },
      { name: 'Snacks', slug: 'cafe-snacks', sortOrder: 5 },
      { name: 'Pasta', slug: 'pasta', sortOrder: 6 },
    ],
  },
  {
    name: 'Bakery',
    slug: 'menu-bakery',
    sortOrder: 3,
    children: [
      { name: 'Cakes', slug: 'cakes', sortOrder: 1 },
      { name: 'Pastry', slug: 'pastry', sortOrder: 2 },
      { name: 'Bread', slug: 'bread', sortOrder: 3 },
      { name: 'Cookies', slug: 'cookies', sortOrder: 4 },
      { name: 'Brownie', slug: 'brownie', sortOrder: 5 },
    ],
  },
  {
    name: 'Sweets',
    slug: 'menu-sweets',
    sortOrder: 4,
    children: [
      { name: 'Indian Sweets', slug: 'indian-sweets', sortOrder: 1 },
      { name: 'Mithai', slug: 'mithai', sortOrder: 2 },
      { name: 'Rasgulla', slug: 'rasgulla', sortOrder: 3 },
      { name: 'Gulab Jamun', slug: 'gulab-jamun', sortOrder: 4 },
      { name: 'Ladoo', slug: 'ladoo', sortOrder: 5 },
    ],
  },
  {
    name: 'Fresh Food',
    slug: 'menu-fresh-food',
    sortOrder: 5,
    children: [],
  },
  {
    name: 'Meat & Fish',
    slug: 'menu-meat-fish',
    sortOrder: 6,
    children: [
      { name: 'Chicken', slug: 'chicken', sortOrder: 1 },
      { name: 'Mutton', slug: 'mutton', sortOrder: 2 },
      { name: 'Fish', slug: 'fish', sortOrder: 3 },
      { name: 'Eggs', slug: 'eggs', sortOrder: 4 },
    ],
  },
];
