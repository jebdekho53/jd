import { merchantFetch } from '@/services/api/merchant-client';

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  platformCategoryId?: string | null;
  platformCategory?: { id: string; name: string; slug: string } | null;
  _count?: { items: number };
  items?: MenuItem[];
}

export interface MenuItemVariant {
  id: string;
  name: string;
  price: number;
  isDefault: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrls?: string[];
  basePrice: number;
  mrp?: number | null;
  dietType: string;
  spiceLevel?: string | null;
  prepTimeMins?: number | null;
  servingSize?: string | null;
  categoryId: string;
  variants?: MenuItemVariant[];
}

export interface AddonGroup {
  id: string;
  name: string;
  selectionType: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  addons: Array<{ id: string; name: string; price: number; dietType?: string | null }>;
}

export interface MenuCombo {
  id: string;
  name: string;
  slug: string;
  comboPrice: number;
  description?: string | null;
  items: Array<{ menuItemId: string; quantity: number; menuItem?: { id: string; name: string } }>;
}

export interface MerchantMenu {
  categories: MenuCategory[];
  addonGroups: AddonGroup[];
  combos: MenuCombo[];
}

export interface KitchenOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  kitchenStatus: string | null;
  status: string;
  createdAt: string;
  foodItems: Array<{ itemName: string; quantity: number; specialInstructions?: string | null }>;
}

export interface KitchenQueue {
  new: KitchenOrder[];
  preparing: KitchenOrder[];
  ready: KitchenOrder[];
  completed: number;
}

export interface RestaurantDashboard {
  todayOrders: number;
  cancelledOrders: number;
  revenue: number;
  acceptanceRate: number;
  avgPrepTimeMins: number | null;
  popularDishes: Array<{ name: string; quantity: number }>;
  kitchenQueue: KitchenQueue;
}

async function unwrap<T>(res: { success?: boolean; data: T }): Promise<T> {
  return res.data;
}

export async function fetchMerchantMenu(storeId: string): Promise<MerchantMenu> {
  const res = await merchantFetch<{ data: MerchantMenu }>(`/api/merchant/stores/${storeId}/menu`);
  return unwrap(res);
}

export async function fetchMenuCategories(storeId: string): Promise<MenuCategory[]> {
  const res = await merchantFetch<{ data: MenuCategory[] }>(
    `/api/merchant/stores/${storeId}/menu/categories`,
  );
  return unwrap(res);
}

export async function createMenuCategory(
  storeId: string,
  body: {
    platformCategoryId: string;
    name?: string;
    description?: string;
    sortOrder?: number;
  },
): Promise<MenuCategory> {
  const res = await merchantFetch<{ data: MenuCategory }>(
    `/api/merchant/stores/${storeId}/menu/categories`,
    { method: 'POST', body: JSON.stringify(body) },
  );
  return unwrap(res);
}

export async function createMenuItem(
  storeId: string,
  body: {
    categoryId: string;
    name: string;
    basePrice: number;
    description?: string;
    imageUrls?: string[];
    mrp?: number;
    servingSize?: string;
    dietType?: string;
    spiceLevel?: string;
    prepTimeMins?: number;
    variants?: Array<{ name: string; price: number; isDefault?: boolean }>;
  },
): Promise<MenuItem> {
  const res = await merchantFetch<{ data: MenuItem }>(
    `/api/merchant/stores/${storeId}/menu/items`,
    { method: 'POST', body: JSON.stringify(body) },
  );
  return unwrap(res);
}

export async function createAddonGroup(
  storeId: string,
  body: {
    name: string;
    selectionType?: string;
    isRequired?: boolean;
    addons?: Array<{ name: string; price?: number }>;
  },
): Promise<AddonGroup> {
  const res = await merchantFetch<{ data: AddonGroup }>(
    `/api/merchant/stores/${storeId}/menu/addon-groups`,
    { method: 'POST', body: JSON.stringify(body) },
  );
  return unwrap(res);
}

export async function linkAddonToItem(
  storeId: string,
  menuItemId: string,
  groupId: string,
): Promise<unknown> {
  const res = await merchantFetch<{ data: unknown }>(
    `/api/merchant/stores/${storeId}/menu/items/${menuItemId}/addon-groups/${groupId}`,
    { method: 'POST' },
  );
  return unwrap(res);
}

export async function createCombo(
  storeId: string,
  body: {
    name: string;
    comboPrice: number;
    description?: string;
    items: Array<{ menuItemId: string; quantity?: number }>;
  },
): Promise<MenuCombo> {
  const res = await merchantFetch<{ data: MenuCombo }>(
    `/api/merchant/stores/${storeId}/menu/combos`,
    { method: 'POST', body: JSON.stringify(body) },
  );
  return unwrap(res);
}

export async function fetchKitchenQueue(storeId: string): Promise<KitchenQueue> {
  const res = await merchantFetch<{ data: KitchenQueue }>(
    `/api/merchant/stores/${storeId}/kitchen/queue`,
  );
  return unwrap(res);
}

export async function updateKitchenOrderStatus(
  storeId: string,
  orderId: string,
  status: string,
): Promise<KitchenOrder> {
  const res = await merchantFetch<{ data: KitchenOrder }>(
    `/api/merchant/stores/${storeId}/kitchen/orders/${orderId}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
  );
  return unwrap(res);
}

export async function fetchRestaurantDashboard(storeId: string): Promise<RestaurantDashboard> {
  const res = await merchantFetch<{ data: RestaurantDashboard }>(
    `/api/merchant/stores/${storeId}/restaurant-dashboard`,
  );
  return unwrap(res);
}
