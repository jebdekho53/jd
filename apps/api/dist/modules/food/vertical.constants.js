"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MENU_CATEGORY_PRESETS = exports.BUYER_HOME_VERTICALS = exports.FOOD_VERTICALS = void 0;
exports.isFoodVertical = isFoodVertical;
exports.slugifyMenu = slugifyMenu;
const client_1 = require("@prisma/client");
exports.FOOD_VERTICALS = new Set([
    client_1.VerticalBusinessType.RESTAURANT,
    client_1.VerticalBusinessType.CLOUD_KITCHEN,
    client_1.VerticalBusinessType.CAFE,
]);
exports.BUYER_HOME_VERTICALS = [
    { label: 'Grocery', slug: 'grocery', businessType: client_1.VerticalBusinessType.GROCERY, href: '/?vertical=grocery' },
    { label: 'Food', slug: 'food', businessType: client_1.VerticalBusinessType.RESTAURANT, href: '/food' },
    { label: 'Bakery', slug: 'bakery', businessType: client_1.VerticalBusinessType.BAKERY, href: '/?vertical=bakery' },
    { label: 'Cafe', slug: 'cafe', businessType: client_1.VerticalBusinessType.CAFE, href: '/?vertical=cafe' },
    { label: 'Fresh', slug: 'fresh', businessType: client_1.VerticalBusinessType.FRUITS_VEGETABLES, href: '/?vertical=fresh' },
    { label: 'Beauty', slug: 'beauty', businessType: client_1.VerticalBusinessType.BEAUTY, href: '/?vertical=beauty' },
    { label: 'Pet', slug: 'pet', businessType: client_1.VerticalBusinessType.PET_STORE, href: '/?vertical=pet' },
    { label: 'Electronics', slug: 'electronics', businessType: client_1.VerticalBusinessType.ELECTRONICS, href: '/?vertical=electronics' },
    { label: 'Flowers', slug: 'flowers', businessType: client_1.VerticalBusinessType.FLOWERS, href: '/?vertical=flowers' },
    { label: 'Baby', slug: 'baby', businessType: client_1.VerticalBusinessType.BABY_STORE, href: '/?vertical=baby' },
    { label: 'Supplements', slug: 'supplements', businessType: client_1.VerticalBusinessType.SUPPLEMENTS, href: '/?vertical=supplements' },
];
exports.MENU_CATEGORY_PRESETS = [
    'PIZZA', 'BURGER', 'ROLLS', 'CHINESE', 'BIRYANI', 'SOUTH_INDIAN', 'NORTH_INDIAN',
    'DESSERTS', 'BEVERAGES', 'COFFEE', 'FAST_FOOD', 'HEALTHY', 'STREET_FOOD',
];
function isFoodVertical(type) {
    return exports.FOOD_VERTICALS.has(type);
}
function slugifyMenu(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'item';
}
//# sourceMappingURL=vertical.constants.js.map