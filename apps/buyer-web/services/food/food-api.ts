import { buyerFetch } from '@/services/api/buyer-auth-client';
import type { ApiResponse } from '@/types/buyer';
import type {
  AddFoodCartItemPayload,
  Cuisine,
  FoodCart,
  FoodCodCheckoutResult,
  HomeVertical,
  InitiateFoodCheckoutPayload,
  ListRestaurantsParams,
  RestaurantDetail,
  RestaurantMenu,
  RestaurantSummary,
  UpdateFoodCartItemPayload,
} from '@/types/food';

function buildQuery(params?: Record<string, string | number | undefined>): string {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function foodPublicFetch<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const res = await fetch(`${path}${buildQuery(params)}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const raw = (body as { message?: string | string[] })?.message ?? 'Request failed';
    const message = Array.isArray(raw) ? raw.join(', ') : String(raw);
    throw new Error(message);
  }
  return (body as ApiResponse<T>).data;
}

export const foodKeys = {
  all: ['food'] as const,
  verticals: () => [...foodKeys.all, 'verticals'] as const,
  restaurants: (params: ListRestaurantsParams) => [...foodKeys.all, 'restaurants', params] as const,
  restaurant: (slug: string) => [...foodKeys.all, 'restaurant', slug] as const,
  menu: (slug: string) => [...foodKeys.all, 'menu', slug] as const,
  cuisines: () => [...foodKeys.all, 'cuisines'] as const,
  cart: () => [...foodKeys.all, 'cart'] as const,
};

export async function getVerticals(): Promise<HomeVertical[]> {
  return foodPublicFetch<HomeVertical[]>('/api/buyer/verticals');
}

export async function listRestaurants(params: ListRestaurantsParams = {}): Promise<RestaurantSummary[]> {
  return foodPublicFetch<RestaurantSummary[]>(
    '/api/buyer/restaurants',
    params as Record<string, string | number | undefined>,
  );
}

export async function getRestaurant(slug: string): Promise<RestaurantDetail> {
  return foodPublicFetch<RestaurantDetail>(`/api/buyer/restaurants/${slug}`);
}

export async function getRestaurantMenu(slug: string): Promise<RestaurantMenu> {
  return foodPublicFetch<RestaurantMenu>(`/api/buyer/restaurants/${slug}/menu`);
}

export async function listCuisines(): Promise<Cuisine[]> {
  return foodPublicFetch<Cuisine[]>('/api/buyer/cuisines');
}

export async function getFoodCart(): Promise<FoodCart | null> {
  const res = await buyerFetch<ApiResponse<FoodCart | null>>('/api/buyer/food-cart');
  return res.data;
}

export async function addFoodCartItem(payload: AddFoodCartItemPayload): Promise<FoodCart> {
  const res = await buyerFetch<ApiResponse<FoodCart>>('/api/buyer/food-cart/items', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateFoodCartItem(itemId: string, payload: UpdateFoodCartItemPayload): Promise<FoodCart | null> {
  const res = await buyerFetch<ApiResponse<FoodCart | null>>(`/api/buyer/food-cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function removeFoodCartItem(itemId: string): Promise<FoodCart | null> {
  const res = await buyerFetch<ApiResponse<FoodCart | null>>(`/api/buyer/food-cart/items/${itemId}`, {
    method: 'DELETE',
  });
  return res.data;
}

export async function clearFoodCart(): Promise<void> {
  await buyerFetch<ApiResponse<FoodCart | null>>('/api/buyer/food-cart', { method: 'DELETE' });
}

export async function initiateFoodCodCheckout(payload: InitiateFoodCheckoutPayload): Promise<FoodCodCheckoutResult> {
  const res = await buyerFetch<ApiResponse<FoodCodCheckoutResult>>('/api/buyer/food-checkout/cod', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  });
  return res.data;
}
