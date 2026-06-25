import { buyerFetch } from '@/services/api/buyer-auth-client';
import { apiGet } from '@/services/api/client';
import type { ApiResponse } from '@/types/buyer';

export interface OrderReviewSnapshot {
  id: string;
  rating: number;
  storeExperience: number;
  deliveryExperience: number;
  productQuality: number;
  title: string | null;
  review: string | null;
  images?: string[];
  verifiedPurchase?: boolean;
  merchantReply?: string | null;
  merchantRepliedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
export interface StoreReview extends OrderReviewSnapshot {
  orderId: string;
  storeId: string;
  images: string[];
  verifiedPurchase: boolean;
  merchantReply: string | null;
  merchantRepliedAt: string | null;
  buyer: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoreReputation {
  averageRating: number;
  totalReviews: number;
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
  distributionPct: Record<'1' | '2' | '3' | '4' | '5', number>;
  repeatCustomers: number;
  responseRate: number;
  rankingScore: number;
}

export interface CreateReviewPayload {
  rating: number;
  storeExperience: number;
  deliveryExperience: number;
  productQuality: number;
  title?: string;
  review?: string;
  images?: string[];
}

export async function createOrderReview(orderId: string, payload: CreateReviewPayload) {
  const res = await buyerFetch<ApiResponse<StoreReview>>(`/api/buyer/orders/${orderId}/review`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateOrderReview(orderId: string, payload: Partial<CreateReviewPayload>) {
  const res = await buyerFetch<ApiResponse<StoreReview>>(`/api/buyer/orders/${orderId}/review`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function getStoreReviews(slug: string, page = 1) {
  const res = await apiGet<ApiResponse<StoreReview[]>>(
    `/buyer/stores/${slug}/reviews`,
    { page, limit: 10 },
  );
  return { reviews: res.data, total: res.meta?.total ?? res.data.length };
}

export async function getStoreReputation(slug: string) {
  const res = await apiGet<ApiResponse<StoreReputation>>(`/buyer/stores/${slug}/reputation`);
  return res.data;
}
