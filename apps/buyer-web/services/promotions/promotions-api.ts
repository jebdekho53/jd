import { buyerFetch } from '@/services/api/buyer-auth-client';
import { apiGet } from '@/services/api/client';
import type { ApiResponse } from '@/types/buyer';
import type { Cart } from '@/types/cart';

export interface StorePromotion {
  id: string;
  name: string;
  description: string | null;
  offerType: string;
  target: string;
  discountValue: number;
  badge?: string;
  startsAt: string;
  expiresAt: string;
}

export interface StoreCoupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  discountValue: number;
  minOrderAmount: number;
  expiresAt: string;
}

export interface DealCard extends StorePromotion {
  store: { id: string; name: string; slug: string; logoUrl: string | null };
}

export interface CampaignOffer {
  id: string;
  name: string;
  kind: string;
  badge: string;
  discountValue: number;
  expiresAt: string;
  flashQtyRemaining?: number | null;
  store?: { id: string; name: string; slug: string; logoUrl?: string | null } | null;
}

export async function getFlashSales(limit = 12) {
  const res = await apiGet<ApiResponse<CampaignOffer[]>>(`/buyer/offers/flash-sales?limit=${limit}`);
  return res.data;
}

export async function getOffersNearYou(lat: number, lng: number, limit = 12) {
  const res = await apiGet<ApiResponse<CampaignOffer[]>>(
    `/buyer/offers/near-you?lat=${lat}&lng=${lng}&limit=${limit}`,
  );
  return res.data;
}

export async function getRecommendedOffers(lat?: number, lng?: number) {
  const params = new URLSearchParams();
  if (lat != null) params.set('lat', String(lat));
  if (lng != null) params.set('lng', String(lng));
  const qs = params.toString();
  const res = await buyerFetch<ApiResponse<CampaignOffer[]>>(
    `/api/buyer/offers/recommended${qs ? `?${qs}` : ''}`,
  );
  return res.data;
}

export async function getTopDeals() {
  const res = await apiGet<ApiResponse<DealCard[]>>('/buyer/deals/top');
  return res.data;
}

export async function getTrendingDeals() {
  const res = await apiGet<ApiResponse<DealCard[]>>('/buyer/deals/trending');
  return res.data;
}

export async function getFreeDeliveryStores() {
  const res = await apiGet<ApiResponse<{ store: unknown; promotion: StorePromotion }[]>>(
    '/buyer/deals/free-delivery',
  );
  return res.data;
}

export async function getStoreOffers(slug: string) {
  const res = await apiGet<ApiResponse<StorePromotion[]>>(`/buyer/stores/${slug}/offers`);
  return res.data;
}

export async function getStoreCoupons(slug: string) {
  const res = await apiGet<ApiResponse<StoreCoupon[]>>(`/buyer/stores/${slug}/coupons`);
  return res.data;
}

export async function validateCoupon(code: string) {
  const res = await buyerFetch<ApiResponse<{ valid: boolean; message?: string }>>(
    '/api/buyer/cart/coupon/validate',
    { method: 'POST', body: JSON.stringify({ code }) },
  );
  return res.data;
}

export async function applyCoupon(code: string) {
  const res = await buyerFetch<ApiResponse<Cart>>('/api/buyer/cart/coupon/apply', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  return res.data;
}

export async function removeCoupon() {
  const res = await buyerFetch<ApiResponse<Cart>>('/api/buyer/cart/coupon', {
    method: 'DELETE',
  });
  return res.data;
}
