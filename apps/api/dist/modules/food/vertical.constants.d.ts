import { VerticalBusinessType } from '@prisma/client';
export declare const FOOD_VERTICALS: ReadonlySet<VerticalBusinessType>;
export declare const BUYER_HOME_VERTICALS: {
    label: string;
    slug: string;
    businessType: VerticalBusinessType;
    href: string;
}[];
export declare const MENU_CATEGORY_PRESETS: readonly ["PIZZA", "BURGER", "ROLLS", "CHINESE", "BIRYANI", "SOUTH_INDIAN", "NORTH_INDIAN", "DESSERTS", "BEVERAGES", "COFFEE", "FAST_FOOD", "HEALTHY", "STREET_FOOD"];
export declare function isFoodVertical(type: VerticalBusinessType): boolean;
export declare function slugifyMenu(text: string): string;
