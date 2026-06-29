"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapPlatformSlugToMenuCategorySlug = mapPlatformSlugToMenuCategorySlug;
const client_1 = require("@prisma/client");
const SLUG_TO_MENU_CATEGORY = {
    pizza: client_1.MenuCategorySlug.PIZZA,
    burger: client_1.MenuCategorySlug.BURGER,
    burgers: client_1.MenuCategorySlug.BURGER,
    rolls: client_1.MenuCategorySlug.ROLLS,
    chinese: client_1.MenuCategorySlug.CHINESE,
    biryani: client_1.MenuCategorySlug.BIRYANI,
    'south-indian': client_1.MenuCategorySlug.SOUTH_INDIAN,
    south_indian: client_1.MenuCategorySlug.SOUTH_INDIAN,
    'north-indian': client_1.MenuCategorySlug.NORTH_INDIAN,
    north_indian: client_1.MenuCategorySlug.NORTH_INDIAN,
    desserts: client_1.MenuCategorySlug.DESSERTS,
    dessert: client_1.MenuCategorySlug.DESSERTS,
    beverages: client_1.MenuCategorySlug.BEVERAGES,
    beverage: client_1.MenuCategorySlug.BEVERAGES,
    drinks: client_1.MenuCategorySlug.BEVERAGES,
    coffee: client_1.MenuCategorySlug.COFFEE,
    'fast-food': client_1.MenuCategorySlug.FAST_FOOD,
    fast_food: client_1.MenuCategorySlug.FAST_FOOD,
    healthy: client_1.MenuCategorySlug.HEALTHY,
    'street-food': client_1.MenuCategorySlug.STREET_FOOD,
    street_food: client_1.MenuCategorySlug.STREET_FOOD,
};
function mapPlatformSlugToMenuCategorySlug(slug) {
    const normalized = slug.trim().toLowerCase().replace(/_/g, '-');
    const direct = SLUG_TO_MENU_CATEGORY[normalized];
    if (direct)
        return direct;
    const upper = normalized.replace(/-/g, '_').toUpperCase();
    if (upper in client_1.MenuCategorySlug) {
        return client_1.MenuCategorySlug[upper];
    }
    return client_1.MenuCategorySlug.OTHER;
}
//# sourceMappingURL=menu-category-slug.util.js.map