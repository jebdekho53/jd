import type { TaxRoot } from './engine';

/**
 * JebDekho GLOBAL MENU taxonomy (catalogKind = MENU) — restaurant / food-service.
 * Reuses the existing menu-catalog slugs (menu-food, north-indian, chinese, …) so
 * those L1/L2 nodes match, and adds cuisine-based L3 dish groups beneath them.
 */
export const MENU_TAXONOMY: TaxRoot[] = [
  {
    name: 'Food',
    slug: 'menu-food',
    catalogKind: 'MENU',
    children: [
      { name: 'North Indian', slug: 'north-indian', children: [
        { name: 'Paneer', slug: 'ni-paneer' },
        { name: 'Dal', slug: 'ni-dal' },
        { name: 'Tandoori & Kebab', slug: 'ni-tandoori-kebab' },
        { name: 'Roti & Naan', slug: 'ni-roti-naan' },
        { name: 'Rice & Pulao', slug: 'ni-rice-pulao' },
        { name: 'Curries & Sabzi', slug: 'ni-curries-sabzi' },
      ] },
      { name: 'South Indian', slug: 'south-indian', children: [
        { name: 'Dosa', slug: 'si-dosa' },
        { name: 'Idli & Vada', slug: 'si-idli-vada' },
        { name: 'Uttapam', slug: 'si-uttapam' },
        { name: 'Meals & Rice', slug: 'si-meals-rice' },
      ] },
      { name: 'Chinese', slug: 'chinese', children: [
        { name: 'Noodles', slug: 'ch-noodles' },
        { name: 'Fried Rice', slug: 'ch-fried-rice' },
        { name: 'Manchurian', slug: 'ch-manchurian' },
        { name: 'Soups', slug: 'ch-soups' },
        { name: 'Starters', slug: 'ch-starters' },
      ] },
      { name: 'Biryani', slug: 'biryani', children: [
        { name: 'Veg Biryani', slug: 'biryani-veg' },
        { name: 'Chicken Biryani', slug: 'biryani-chicken' },
        { name: 'Mutton Biryani', slug: 'biryani-mutton' },
        { name: 'Egg Biryani', slug: 'biryani-egg' },
      ] },
      { name: 'Pizza', slug: 'pizza', children: [
        { name: 'Veg Pizza', slug: 'pizza-veg' },
        { name: 'Non-Veg Pizza', slug: 'pizza-non-veg' },
        { name: 'Cheese Burst', slug: 'pizza-cheese-burst' },
        { name: 'Thin Crust', slug: 'pizza-thin-crust' },
        { name: 'Garlic Bread & Sides', slug: 'pizza-garlic-bread-sides' },
      ] },
      { name: 'Burger', slug: 'burger', children: [
        { name: 'Veg Burger', slug: 'burger-veg' },
        { name: 'Non-Veg Burger', slug: 'burger-non-veg' },
      ] },
      { name: 'Fast Food', slug: 'fast-food', children: [
        { name: 'Fries', slug: 'ff-fries' },
        { name: 'Wraps', slug: 'ff-wraps' },
        { name: 'Hot Dog', slug: 'ff-hot-dog' },
        { name: 'Nuggets & Sides', slug: 'ff-nuggets-sides' },
      ] },
      { name: 'Street Food', slug: 'street-food', children: [
        { name: 'Chaat', slug: 'sf-chaat' },
        { name: 'Pani Puri', slug: 'sf-pani-puri' },
        { name: 'Dahi Bhalla', slug: 'sf-dahi-bhalla' },
        { name: 'Vada Pav', slug: 'sf-vada-pav' },
        { name: 'Pav Bhaji', slug: 'sf-pav-bhaji' },
        { name: 'Kachori & Samosa', slug: 'sf-kachori-samosa' },
      ] },
      { name: 'Rolls', slug: 'rolls', children: [
        { name: 'Veg Rolls', slug: 'rolls-veg' },
        { name: 'Non-Veg Rolls', slug: 'rolls-non-veg' },
      ] },
      { name: 'Momos', slug: 'momos', children: [
        { name: 'Steamed Momos', slug: 'momos-steamed' },
        { name: 'Fried Momos', slug: 'momos-fried' },
        { name: 'Tandoori Momos', slug: 'momos-tandoori' },
      ] },
      { name: 'Sandwich', slug: 'sandwich' },
      { name: 'Desserts', slug: 'desserts', children: [
        { name: 'Ice Cream', slug: 'dessert-ice-cream' },
        { name: 'Cakes & Pastries', slug: 'dessert-cakes-pastries' },
        { name: 'Indian Desserts', slug: 'dessert-indian' },
      ] },
      { name: 'Beverages', slug: 'beverages', children: [
        { name: 'Soft Drinks', slug: 'bev-soft-drinks' },
        { name: 'Juices & Mocktails', slug: 'bev-juices-mocktails' },
        { name: 'Lassi & Chaas', slug: 'bev-lassi-chaas' },
      ] },
      { name: 'Healthy Food', slug: 'healthy-food', children: [
        { name: 'Salads', slug: 'hf-salads' },
        { name: 'Bowls', slug: 'hf-bowls' },
      ] },
      { name: 'Breakfast', slug: 'breakfast', children: [
        { name: 'Poha & Upma', slug: 'bf-poha-upma' },
        { name: 'Paratha', slug: 'bf-paratha' },
        { name: 'Egg Dishes', slug: 'bf-egg-dishes' },
      ] },
      { name: 'Thali', slug: 'thali', children: [
        { name: 'Veg Thali', slug: 'thali-veg' },
        { name: 'Non-Veg Thali', slug: 'thali-non-veg' },
      ] },
    ],
  },
  {
    name: 'Cafe',
    slug: 'menu-cafe',
    catalogKind: 'MENU',
    children: [
      { name: 'Coffee', slug: 'coffee', children: [
        { name: 'Hot Coffee', slug: 'coffee-hot' },
        { name: 'Espresso & Cappuccino', slug: 'coffee-espresso-cappuccino' },
      ] },
      { name: 'Cold Coffee', slug: 'cold-coffee' },
      { name: 'Tea', slug: 'tea', children: [
        { name: 'Masala Chai', slug: 'tea-masala-chai' },
        { name: 'Green & Herbal Tea', slug: 'tea-green-herbal' },
      ] },
      { name: 'Shakes', slug: 'shakes' },
      { name: 'Snacks', slug: 'cafe-snacks' },
      { name: 'Pasta', slug: 'pasta', children: [
        { name: 'Red Sauce Pasta', slug: 'pasta-red-sauce' },
        { name: 'White Sauce Pasta', slug: 'pasta-white-sauce' },
      ] },
    ],
  },
  {
    name: 'Bakery',
    slug: 'menu-bakery',
    catalogKind: 'MENU',
    children: [
      { name: 'Cakes', slug: 'cakes', children: [
        { name: 'Birthday Cakes', slug: 'cakes-birthday' },
        { name: 'Cup Cakes', slug: 'cakes-cup' },
        { name: 'Eggless Cakes', slug: 'cakes-eggless' },
      ] },
      { name: 'Pastry', slug: 'pastry' },
      { name: 'Bread', slug: 'bread' },
      { name: 'Cookies', slug: 'cookies' },
      { name: 'Brownie', slug: 'brownie' },
    ],
  },
  {
    name: 'Sweets',
    slug: 'menu-sweets',
    catalogKind: 'MENU',
    children: [
      { name: 'Mithai', slug: 'mithai' },
      { name: 'Ladoo', slug: 'ladoo' },
      { name: 'Gulab Jamun', slug: 'gulab-jamun' },
      { name: 'Rasgulla', slug: 'rasgulla' },
      { name: 'Indian Sweets', slug: 'indian-sweets' },
      { name: 'Bengali Sweets', slug: 'bengali-sweets' },
      { name: 'Dry Fruit Sweets', slug: 'dry-fruit-sweets' },
    ],
  },
  {
    name: 'Meat & Fish',
    slug: 'menu-meat-fish',
    catalogKind: 'MENU',
    children: [
      { name: 'Chicken', slug: 'chicken' },
      { name: 'Mutton', slug: 'mutton' },
      { name: 'Fish', slug: 'fish' },
      { name: 'Eggs', slug: 'eggs' },
      { name: 'Prawns & Seafood', slug: 'prawns-seafood' },
    ],
  },
  {
    name: 'Fresh Food',
    slug: 'menu-fresh-food',
    catalogKind: 'MENU',
    children: [
      { name: 'Ready to Cook', slug: 'ff-ready-to-cook' },
      { name: 'Marinated Meat', slug: 'ff-marinated-meat' },
      { name: 'Cut Fruits & Salads', slug: 'ff-cut-fruits-salads' },
    ],
  },
];
