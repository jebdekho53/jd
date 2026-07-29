/** Mirrors apps/api/src/modules/food — restaurant discovery, menu, food cart
 *  and food checkout. The food cart is deliberately separate from the grocery
 *  cart (different table, single-restaurant constraint, its own checkout). */

export interface HomeVertical {
  label: string;
  slug: string;
  businessType: string;
  href: string;
}

export interface Cuisine {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface RestaurantSummary {
  id: string;
  name: string;
  slug: string;
  bannerUrl: string | null;
  logoUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  avgPrepTimeMins: number;
  costForTwo: number | null;
  cuisines: Cuisine[];
  businessTypes: string[];
  isCloudKitchen: boolean;
  /** Only populated when lat/lng were supplied to the list endpoint. */
  distanceKm: number | null;
}

export interface RestaurantReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  buyerName?: string | null;
}

export interface RestaurantDetail extends RestaurantSummary {
  description: string | null;
  phone: string | null;
  line1: string;
  locality: string | null;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  packagingFee: number;
  minOrderAmount: number;
  acceptsScheduled: boolean;
  reviews: RestaurantReview[];
}

export interface MenuItemVariant {
  id: string;
  name: string;
  price: number | string;
  isDefault: boolean;
  availability: string;
  sortOrder: number;
}

export interface MenuAddon {
  id: string;
  name: string;
  price: number | string;
  isActive: boolean;
  sortOrder: number;
}

export interface MenuAddonGroup {
  id: string;
  name: string;
  selectionType: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  addons: MenuAddon[];
}

export interface MenuItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrls: string[];
  basePrice: number | string;
  mrp: number | string | null;
  dietType: 'VEG' | 'NON_VEG' | 'EGG' | string;
  spiceLevel: string | null;
  prepTimeMins: number;
  servingSize: string | null;
  availability: string;
  variants: MenuItemVariant[];
  addonGroups: { group: MenuAddonGroup; sortOrder: number }[];
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  categorySlug: string | null;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  items: MenuItem[];
}

export interface RestaurantCombo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  comboPrice: number | string;
  items: { menuItem: { id: string; name: string; imageUrls: unknown; dietType: string } }[];
}

/** `/buyer/restaurants/:slug/menu` returns the raw store row alongside the
 *  menu — only the identity fields are relied on here; the richer restaurant
 *  shape comes from `/buyer/restaurants/:slug`. */
export interface RestaurantMenu {
  store: { id: string; name: string; slug: string };
  categories: MenuCategory[];
  combos: RestaurantCombo[];
}

export interface FoodCartItem {
  id: string;
  menuItemId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  specialInstructions: string | null;
  menuItem: {
    id: string;
    name: string;
    imageUrls: string[];
    dietType: string;
    availability: string;
  };
  variantName?: string;
  addons: { name: string; price: number }[];
}

export interface FoodCartTotals {
  subtotal: number;
  packagingFee: number;
  deliveryFee: number;
  tax: number;
  grandTotal: number;
}

export interface FoodCart {
  id: string;
  storeId: string;
  store: {
    id: string;
    name: string;
    slug: string;
    minOrderAmount: number;
    deliveryFee: number;
    packagingFee: number;
    /** 'SELF' stores have no rider — COD is not offered for them (no
     *  cash-collection agent). */
    deliveryMode?: 'PLATFORM' | 'SELF';
  };
  items: FoodCartItem[];
  totals: FoodCartTotals;
  itemCount: number;
}

export interface AddFoodCartItemPayload {
  menuItemId: string;
  variantId?: string;
  comboId?: string;
  quantity?: number;
  addonIds?: string[];
  specialInstructions?: string;
}

export interface InitiateFoodCheckoutPayload {
  deliveryAddress: Record<string, unknown>;
  deliveryLat: number;
  deliveryLng: number;
  paymentMethod: 'COD' | 'RAZORPAY';
  tipAmount?: number;
  scheduledDeliveryAt?: string;
  specialInstructions?: string;
  restaurantNote?: string;
}

export interface FoodCodCheckoutResult {
  orderId: string;
  orderNumber: string;
  status: string;
}

export interface ListRestaurantsParams {
  lat?: number;
  lng?: number;
  pincode?: string;
  cuisine?: string;
  vertical?: string;
  page?: number;
  limit?: number;
}
