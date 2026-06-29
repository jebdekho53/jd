import { MenuCategorySlug } from '@prisma/client';

const SLUG_TO_MENU_CATEGORY: Record<string, MenuCategorySlug> = {
  pizza: MenuCategorySlug.PIZZA,
  burger: MenuCategorySlug.BURGER,
  burgers: MenuCategorySlug.BURGER,
  rolls: MenuCategorySlug.ROLLS,
  chinese: MenuCategorySlug.CHINESE,
  biryani: MenuCategorySlug.BIRYANI,
  'south-indian': MenuCategorySlug.SOUTH_INDIAN,
  south_indian: MenuCategorySlug.SOUTH_INDIAN,
  'north-indian': MenuCategorySlug.NORTH_INDIAN,
  north_indian: MenuCategorySlug.NORTH_INDIAN,
  desserts: MenuCategorySlug.DESSERTS,
  dessert: MenuCategorySlug.DESSERTS,
  beverages: MenuCategorySlug.BEVERAGES,
  beverage: MenuCategorySlug.BEVERAGES,
  drinks: MenuCategorySlug.BEVERAGES,
  coffee: MenuCategorySlug.COFFEE,
  'fast-food': MenuCategorySlug.FAST_FOOD,
  fast_food: MenuCategorySlug.FAST_FOOD,
  healthy: MenuCategorySlug.HEALTHY,
  'street-food': MenuCategorySlug.STREET_FOOD,
  street_food: MenuCategorySlug.STREET_FOOD,
};

export function mapPlatformSlugToMenuCategorySlug(slug: string): MenuCategorySlug {
  const normalized = slug.trim().toLowerCase().replace(/_/g, '-');
  const direct = SLUG_TO_MENU_CATEGORY[normalized];
  if (direct) return direct;

  const upper = normalized.replace(/-/g, '_').toUpperCase();
  if (upper in MenuCategorySlug) {
    return MenuCategorySlug[upper as keyof typeof MenuCategorySlug];
  }

  return MenuCategorySlug.OTHER;
}
