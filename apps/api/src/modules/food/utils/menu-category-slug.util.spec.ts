import { MenuCategorySlug } from '@prisma/client';
import { mapPlatformSlugToMenuCategorySlug } from './menu-category-slug.util';

describe('menu-category-slug.util', () => {
  it('maps known slugs', () => {
    expect(mapPlatformSlugToMenuCategorySlug('biryani')).toBe(MenuCategorySlug.BIRYANI);
    expect(mapPlatformSlugToMenuCategorySlug('south-indian')).toBe(MenuCategorySlug.SOUTH_INDIAN);
  });

  it('falls back to OTHER for unknown slugs', () => {
    expect(mapPlatformSlugToMenuCategorySlug('hyderabadi-specials')).toBe(MenuCategorySlug.OTHER);
  });
});
