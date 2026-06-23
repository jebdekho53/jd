import { buyerFetch } from '@/services/api/buyer-auth-client';
import type { ApiResponse } from '@/types/buyer';
import type { Cart, AddCartItemPayload, UpdateCartItemPayload } from '@/types/cart';

export async function getCart(): Promise<Cart | null> {
  const res = await buyerFetch<ApiResponse<Cart | null>>('/api/buyer/cart');
  return res.data;
}

export async function addCartItem(payload: AddCartItemPayload): Promise<Cart> {
  const res = await buyerFetch<ApiResponse<Cart>>('/api/buyer/cart/items', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateCartItem(itemId: string, payload: UpdateCartItemPayload): Promise<Cart | null> {
  const res = await buyerFetch<ApiResponse<Cart | null>>(`/api/buyer/cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function removeCartItem(itemId: string): Promise<Cart | null> {
  const res = await buyerFetch<ApiResponse<Cart | null>>(`/api/buyer/cart/items/${itemId}`, {
    method: 'DELETE',
  });
  return res.data;
}

export async function clearCart(): Promise<void> {
  await buyerFetch<ApiResponse<{ message: string }>>('/api/buyer/cart', {
    method: 'DELETE',
  });
}
